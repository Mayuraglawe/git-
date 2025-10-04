import { RequestHandler } from "express";
import { 
  ScheduledClass, 
  CreateScheduledClassRequest, 
  UpdateScheduledClassRequest,
  ScheduledClassWithDetails,
  TimeSlot,
  QueryOptions,
  ApiResponse,
  ApiError,
  PaginatedResponse
} from "@shared/database-types";
import { getSupabaseAdminClient } from "@shared/supabase";

const supabase = getSupabaseAdminClient() as any;

/**
 * ============================================================================
 * SCHEDULED CLASS CRUD OPERATIONS
 * Class scheduling with time slot assignment and resource allocation
 * ============================================================================
 */

/**
 * GET /api/scheduled-classes
 * Retrieve all scheduled classes with filtering and pagination
 */
export const getAllScheduledClasses: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      timetable_id,
      faculty_id,
      batch_id,
      classroom_id,
      subject_id,
      day_of_week,
      class_type,
      week_pattern,
      academic_year,
      semester,
      sort_by = 'time_slot.day_of_week,time_slot.start_time',
      sort_order = 'asc'
    } = req.query;

    let query = supabase
      .from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*),
        timetable:timetables(*)
      `, { count: 'exact' });

    // Apply filters
    if (timetable_id) {
      query = query.eq('timetable_id', timetable_id);
    }

    if (faculty_id) {
      query = query.eq('faculty_id', faculty_id);
    }

    if (batch_id) {
      query = query.eq('batch_id', batch_id);
    }

    if (classroom_id) {
      query = query.eq('classroom_id', classroom_id);
    }

    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }

    if (class_type) {
      query = query.eq('class_type', class_type);
    }

    if (week_pattern) {
      query = query.eq('week_pattern', week_pattern);
    }

    if (day_of_week) {
      query = query.eq('time_slot.day_of_week', day_of_week);
    }

    // Apply timetable filters
    if (academic_year || semester) {
      if (academic_year) {
        query = query.eq('timetable.academic_year', academic_year);
      }
      if (semester) {
        query = query.eq('timetable.semester', Number(semester));
      }
    }

    // Apply sorting
    const sortByString = Array.isArray(sort_by) ? sort_by[0] : sort_by;
    if (typeof sortByString === 'string' && sortByString.includes('.')) {
      const [table, field] = sortByString.split('.');
      query = query.order(field, { foreignTable: table, ascending: sort_order === 'asc' });
    } else {
      query = query.order(sortByString as string, { ascending: sort_order === 'asc' });
    }

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching scheduled classes:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch scheduled classes',
        status: 500,
        details: error
      } as any);
    }

    const response: PaginatedResponse<ScheduledClassWithDetails> = {
      data: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
        hasNext: to < (count || 0) - 1,
        hasPrev: Number(page) > 1
      },
      success: true
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getAllScheduledClasses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * GET /api/scheduled-classes/:id
 * Retrieve a specific scheduled class by ID
 */
export const getScheduledClassById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*),
        timetable:timetables(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Scheduled class not found',
          status: 404
        } as any);
      }
      
      console.error('Error fetching scheduled class:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch scheduled class',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<ScheduledClassWithDetails> = {
      data,
      success: true,
      message: 'Scheduled class retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getScheduledClassById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * POST /api/scheduled-classes
 * Create a new scheduled class with validation
 */
export const createScheduledClass: RequestHandler = async (req, res) => {
  try {
    const classData: CreateScheduledClassRequest = req.body;

    // Validation
    const requiredFields = ['timetable_id', 'time_slot_id', 'subject_id', 'faculty_id', 'batch_id', 'classroom_id'];
    const missingFields = requiredFields.filter(field => !classData[field as keyof CreateScheduledClassRequest]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        status: 400
      } as any);
    }

    // Validate all referenced entities exist
    const [timetable, timeSlot, subject, faculty, batch, classroom] = await Promise.all([
      supabase.from('timetables').select('id').eq('id', classData.timetable_id).single(),
      supabase.from('time_slots').select('id').eq('id', classData.time_slot_id).single(),
      supabase.from('subjects').select('id').eq('id', classData.subject_id).single(),
      supabase.from('faculty').select('id').eq('id', classData.faculty_id).eq('is_active', true).single(),
      supabase.from('student_batches').select('id').eq('id', classData.batch_id).eq('is_active', true).single(),
      supabase.from('classrooms').select('id').eq('id', classData.classroom_id).eq('is_available', true).single()
    ]);

    const validationErrors = [];
    if (!timetable.data) validationErrors.push('Invalid timetable ID');
    if (!timeSlot.data) validationErrors.push('Invalid time slot ID');
    if (!subject.data) validationErrors.push('Invalid subject ID');
    if (!faculty.data) validationErrors.push('Invalid or inactive faculty ID');
    if (!batch.data) validationErrors.push('Invalid or inactive batch ID');
    if (!classroom.data) validationErrors.push('Invalid or unavailable classroom ID');

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationErrors.join(', '),
        status: 400
      } as any);
    }

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('scheduled_classes')
      .select('id')
      .eq('time_slot_id', classData.time_slot_id)
      .or(`faculty_id.eq.${classData.faculty_id},batch_id.eq.${classData.batch_id},classroom_id.eq.${classData.classroom_id}`);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Time slot conflict detected with faculty, batch, or classroom',
        status: 409,
        details: { conflicting_classes: conflicts }
      } as any);
    }

    const { data, error } = await supabase
      .from('scheduled_classes')
      .insert([{
        ...classData,
        class_type: classData.class_type || 'lecture',
        week_pattern: classData.week_pattern || 'weekly',
        recurring: classData.recurring !== false
      }])
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*),
        timetable:timetables(*)
      `)
      .single();

    if (error) {
      console.error('Error creating scheduled class:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create scheduled class',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<ScheduledClassWithDetails> = {
      data,
      success: true,
      message: 'Scheduled class created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createScheduledClass:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * PUT /api/scheduled-classes/:id
 * Update an existing scheduled class
 */
export const updateScheduledClass: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateScheduledClassRequest = req.body;

    // Check if scheduled class exists
    const { data: existingClass, error: checkError } = await supabase
      .from('scheduled_classes')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingClass) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Scheduled class not found',
        status: 404
      } as any);
    }

    // Validate referenced entities if they're being updated
    const validationPromises = [];
    if (updateData.timetable_id) {
      validationPromises.push(supabase.from('timetables').select('id').eq('id', updateData.timetable_id).single());
    }
    if (updateData.time_slot_id) {
      validationPromises.push(supabase.from('time_slots').select('id').eq('id', updateData.time_slot_id).single());
    }
    if (updateData.subject_id) {
      validationPromises.push(supabase.from('subjects').select('id').eq('id', updateData.subject_id).single());
    }
    if (updateData.faculty_id) {
      validationPromises.push(supabase.from('faculty').select('id').eq('id', updateData.faculty_id).eq('is_active', true).single());
    }
    if (updateData.batch_id) {
      validationPromises.push(supabase.from('student_batches').select('id').eq('id', updateData.batch_id).eq('is_active', true).single());
    }
    if (updateData.classroom_id) {
      validationPromises.push(supabase.from('classrooms').select('id').eq('id', updateData.classroom_id).eq('is_available', true).single());
    }

    if (validationPromises.length > 0) {
      const validationResults = await Promise.all(validationPromises);
      const hasInvalidReferences = validationResults.some(result => !result.data);
      
      if (hasInvalidReferences) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'One or more referenced entities are invalid or inactive',
          status: 400
        } as any);
      }
    }

    // Check for conflicts if time slot is being changed
    if (updateData.time_slot_id && updateData.time_slot_id !== existingClass.time_slot_id) {
      const { data: conflicts } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('time_slot_id', updateData.time_slot_id)
        .neq('id', id)
        .or(`faculty_id.eq.${updateData.faculty_id || existingClass.faculty_id},batch_id.eq.${updateData.batch_id || existingClass.batch_id},classroom_id.eq.${updateData.classroom_id || existingClass.classroom_id}`);

      if (conflicts && conflicts.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Time slot conflict detected',
          status: 409,
          details: { conflicting_classes: conflicts }
        } as any);
      }
    }

    const { data, error } = await supabase
      .from('scheduled_classes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*),
        timetable:timetables(*)
      `)
      .single();

    if (error) {
      console.error('Error updating scheduled class:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update scheduled class',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<ScheduledClassWithDetails> = {
      data,
      success: true,
      message: 'Scheduled class updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateScheduledClass:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * DELETE /api/scheduled-classes/:id
 * Delete a scheduled class
 */
export const deleteScheduledClass: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scheduled class exists
    const { data: existingClass, error: checkError } = await supabase
      .from('scheduled_classes')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingClass) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Scheduled class not found',
        status: 404
      } as any);
    }

    const { error } = await supabase
      .from('scheduled_classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scheduled class:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete scheduled class',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Scheduled class deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteScheduledClass:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * ============================================================================
 * SPECIALIZED SCHEDULED CLASS ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/scheduled-classes/bulk-create
 * Create multiple scheduled classes at once
 */
export const bulkCreateScheduledClasses: RequestHandler = async (req, res) => {
  try {
    const { classes }: { classes: CreateScheduledClassRequest[] } = req.body;

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Classes array is required and must not be empty',
        status: 400
      } as any);
    }

    // Validate each class
    const validationErrors: string[] = [];
    const requiredFields = ['timetable_id', 'time_slot_id', 'subject_id', 'faculty_id', 'batch_id', 'classroom_id'];

    classes.forEach((classData, index) => {
      const missingFields = requiredFields.filter(field => !classData[field as keyof CreateScheduledClassRequest]);
      if (missingFields.length > 0) {
        validationErrors.push(`Class ${index + 1}: Missing ${missingFields.join(', ')}`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationErrors.join('; '),
        status: 400
      } as any);
    }

    // Insert all classes
    const { data, error } = await supabase
      .from('scheduled_classes')
      .insert(classes.map(classData => ({
        ...classData,
        class_type: classData.class_type || 'lecture',
        week_pattern: classData.week_pattern || 'weekly',
        recurring: classData.recurring !== false
      })))
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*),
        timetable:timetables(*)
      `);

    if (error) {
      console.error('Error bulk creating scheduled classes:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create scheduled classes',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<ScheduledClassWithDetails[]> = {
      data: data || [],
      success: true,
      message: `${data?.length || 0} scheduled classes created successfully`
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in bulkCreateScheduledClasses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * GET /api/scheduled-classes/timetable/:timetableId/grid
 * Get timetable in grid format for display
 */
export const getTimetableGrid: RequestHandler = async (req, res) => {
  try {
    const { timetableId } = req.params;

    // Get all scheduled classes for the timetable
    const { data: classes, error } = await supabase
      .from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*)
      `)
      .eq('timetable_id', timetableId)
      .order('time_slot.day_of_week')
      .order('time_slot.start_time');

    if (error) {
      console.error('Error fetching timetable grid:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch timetable grid',
        status: 500,
        details: error
      } as any);
    }

    // Get all time slots for structure
    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    // Organize classes by day and time
    const grid: { [key: string]: { [key: string]: ScheduledClassWithDetails[] } } = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Initialize grid structure
    days.forEach(day => {
      grid[day] = {};
    });

    // Populate grid with classes
    classes?.forEach(cls => {
      if (cls.time_slot) {
        const day = cls.time_slot.day_of_week;
        const timeKey = `${cls.time_slot.start_time}-${cls.time_slot.end_time}`;
        
        if (!grid[day][timeKey]) {
          grid[day][timeKey] = [];
        }
        grid[day][timeKey].push(cls);
      }
    });

    const response: ApiResponse<{
      grid: typeof grid;
      time_slots: typeof timeSlots;
      total_classes: number;
    }> = {
      data: {
        grid,
        time_slots: timeSlots || [],
        total_classes: classes?.length || 0
      },
      success: true,
      message: 'Timetable grid retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getTimetableGrid:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};