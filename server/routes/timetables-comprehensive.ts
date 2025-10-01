import { RequestHandler } from "express";
import { 
  Timetable, 
  CreateTimetableRequest, 
  UpdateTimetableRequest,
  TimetableWithClasses,
  ScheduledClassWithDetails,
  TimetableGenerationRequest,
  TimetableGenerationResult,
  ConflictDetectionResult,
  ScheduleConflict,
  TimetableStatus,
  QueryOptions,
  ApiResponse,
  ApiError,
  PaginatedResponse
} from "@shared/database-types";
import { getSupabaseAdminClient } from "@shared/supabase";

const supabase = getSupabaseAdminClient() as any; // Type casting for comprehensive operations

/**
 * ============================================================================
 * TIMETABLE CRUD OPERATIONS
 * Core timetable management with version control and approval workflow
 * ============================================================================
 */

/**
 * GET /api/timetables
 * Retrieve all timetables with filtering, sorting, and pagination
 */
export const getAllTimetables: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      department_id,
      academic_year,
      semester,
      status,
      created_by,
      is_active,
      sort_by = 'created_at',
      sort_order = 'desc',
      include_classes,
      include_creator,
      include_department
    } = req.query;

    let query = supabase
      .from('timetables')
      .select(`
        *
        ${include_department === 'true' ? `,department:departments(*)` : ''}
        ${include_creator === 'true' ? `,created_by_faculty:faculty!timetables_created_by_fkey(*)` : ''}
        ${include_classes === 'true' ? `,
          scheduled_classes(
            *,
            time_slot:time_slots(*),
            subject:subjects(*),
            faculty:faculty(*),
            batch:student_batches(*),
            classroom:classrooms(*)
          )
        ` : ''}
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,optimization_notes.ilike.%${search}%`);
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching timetables:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch timetables',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: PaginatedResponse<Timetable | TimetableWithClasses> = {
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
    console.error('Error in getAllTimetables:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/timetables/:id
 * Retrieve a specific timetable by ID with detailed information
 */
export const getTimetableById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_classes = 'true', include_conflicts, include_analytics } = req.query;

    let selectQuery = `
      *,
      department:departments(*),
      created_by_faculty:faculty!timetables_created_by_fkey(*),
      approved_by_faculty:faculty!timetables_approved_by_fkey(*)
      ${include_classes === 'true' ? `,
        scheduled_classes(
          *,
          time_slot:time_slots(*),
          subject:subjects(*),
          faculty:faculty(*),
          batch:student_batches(*),
          classroom:classrooms(*)
        )
      ` : ''}
    `;

    const { data, error } = await supabase
      .from('timetables')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Timetable not found',
          status: 404
        } as ApiError);
      }
      
      console.error('Error fetching timetable:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch timetable',
        status: 500,
        details: error
      } as ApiError);
    }

    // Include conflicts if requested
    if (include_conflicts === 'true') {
      const { data: conflicts } = await supabase
        .from('schedule_conflicts')
        .select('*')
        .eq('timetable_id', id)
        .order('severity', { ascending: false })
        .order('detected_at', { ascending: false });

      data.conflicts = conflicts || [];
    }

    // Include analytics if requested
    if (include_analytics === 'true') {
      const classes = data.scheduled_classes || [];
      const analytics = {
        total_classes: classes.length,
        faculty_utilization: calculateFacultyUtilization(classes),
        classroom_utilization: calculateClassroomUtilization(classes),
        time_distribution: calculateTimeDistribution(classes),
        department_distribution: calculateDepartmentDistribution(classes)
      };

      data.analytics = analytics;
    }

    const response: ApiResponse<TimetableWithClasses> = {
      data,
      success: true,
      message: 'Timetable retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getTimetableById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/timetables
 * Create a new timetable with validation
 */
export const createTimetable: RequestHandler = async (req, res) => {
  try {
    const timetableData: CreateTimetableRequest = req.body;

    // Validation
    if (!timetableData.name || !timetableData.academic_year || !timetableData.semester) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, academic year, and semester are required',
        status: 400
      } as ApiError);
    }

    // Validate department if provided
    if (timetableData.department_id) {
      const { data: deptExists, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('id', timetableData.department_id)
        .eq('is_active', true)
        .single();

      if (!deptExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Department ID',
          status: 400
        } as ApiError);
      }
    }

    // Validate created_by faculty if provided
    if (timetableData.created_by) {
      const { data: facultyExists, error: facultyError } = await supabase
        .from('faculty')
        .select('id')
        .eq('id', timetableData.created_by)
        .eq('is_active', true)
        .single();

      if (!facultyExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Creator Faculty ID',
          status: 400
        } as ApiError);
      }
    }

    // Validate semester range
    if (timetableData.semester < 1 || timetableData.semester > 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Semester must be between 1 and 8',
        status: 400
      } as ApiError);
    }

    // Check for duplicate timetable names in the same context
    let duplicateQuery = supabase
      .from('timetables')
      .select('id')
      .eq('name', timetableData.name)
      .eq('academic_year', timetableData.academic_year)
      .eq('semester', timetableData.semester);

    if (timetableData.department_id) {
      duplicateQuery = duplicateQuery.eq('department_id', timetableData.department_id);
    }

    const { data: existingTimetable } = await duplicateQuery.single();

    if (existingTimetable) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Timetable with this name already exists for the same academic year and semester',
        status: 409
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('timetables')
      .insert([{
        ...timetableData,
        status: timetableData.status || 'draft',
        version: timetableData.version || 1,
        conflict_count: 0,
        is_active: true
      }])
      .select(`
        *,
        department:departments(*),
        created_by_faculty:faculty!timetables_created_by_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error creating timetable:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create timetable',
        status: 500,
        details: error
      } as ApiError);
    }

    // Log the creation
    await supabase.from('timetable_change_logs').insert([{
      timetable_id: data.id,
      changed_by: timetableData.created_by,
      change_type: 'created',
      change_description: `Timetable "${data.name}" created`,
      new_values: { name: data.name, status: data.status }
    }]);

    const response: ApiResponse<Timetable> = {
      data,
      success: true,
      message: 'Timetable created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createTimetable:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * PUT /api/timetables/:id
 * Update an existing timetable
 */
export const updateTimetable: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateTimetableRequest = req.body;

    // Check if timetable exists
    const { data: existingTimetable, error: checkError } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingTimetable) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Timetable not found',
        status: 404
      } as ApiError);
    }

    // Prevent updates to published timetables without approval
    if (existingTimetable.status === 'published' && !updateData.approved_by) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Published timetables can only be updated with proper approval',
        status: 403
      } as ApiError);
    }

    // Validate department if being updated
    if (updateData.department_id) {
      const { data: deptExists } = await supabase
        .from('departments')
        .select('id')
        .eq('id', updateData.department_id)
        .eq('is_active', true)
        .single();

      if (!deptExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Department ID',
          status: 400
        } as ApiError);
      }
    }

    // Validate approved_by faculty if provided
    if (updateData.approved_by) {
      const { data: facultyExists } = await supabase
        .from('faculty')
        .select('id')
        .eq('id', updateData.approved_by)
        .eq('is_active', true)
        .single();

      if (!facultyExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Approver Faculty ID',
          status: 400
        } as ApiError);
      }
    }

    // Store old values for change log
    const oldValues = {
      name: existingTimetable.name,
      status: existingTimetable.status,
      version: existingTimetable.version
    };

    const { data, error } = await supabase
      .from('timetables')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        approved_at: updateData.approved_by ? new Date().toISOString() : existingTimetable.approved_at
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        created_by_faculty:faculty!timetables_created_by_fkey(*),
        approved_by_faculty:faculty!timetables_approved_by_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error updating timetable:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update timetable',
        status: 500,
        details: error
      } as ApiError);
    }

    // Log the change
    await supabase.from('timetable_change_logs').insert([{
      timetable_id: data.id,
      changed_by: updateData.approved_by || existingTimetable.created_by,
      change_type: 'updated',
      change_description: `Timetable "${data.name}" updated`,
      old_values: oldValues,
      new_values: {
        name: data.name,
        status: data.status,
        version: data.version
      }
    }]);

    const response: ApiResponse<Timetable> = {
      data,
      success: true,
      message: 'Timetable updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateTimetable:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * DELETE /api/timetables/:id
 * Delete a timetable (soft delete by setting is_active to false)
 */
export const deleteTimetable: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete, deleted_by } = req.query;

    // Check if timetable exists
    const { data: existingTimetable, error: checkError } = await supabase
      .from('timetables')
      .select('id, name, status')
      .eq('id', id)
      .single();

    if (!existingTimetable) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Timetable not found',
        status: 404
      } as ApiError);
    }

    // Prevent deletion of published timetables
    if (existingTimetable.status === 'published' && hard_delete !== 'true') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Published timetables cannot be deleted. Use hard_delete=true to force deletion.',
        status: 403
      } as ApiError);
    }

    if (hard_delete === 'true') {
      // Hard delete - remove all related data
      await supabase.from('scheduled_classes').delete().eq('timetable_id', id);
      await supabase.from('schedule_conflicts').delete().eq('timetable_id', id);
      await supabase.from('timetable_change_logs').delete().eq('timetable_id', id);
      
      const { error } = await supabase
        .from('timetables')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting timetable:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete timetable',
          status: 500,
          details: error
        } as ApiError);
      }
    } else {
      // Soft delete
      const { data, error } = await supabase
        .from('timetables')
        .update({
          is_active: false,
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error archiving timetable:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to archive timetable',
          status: 500,
          details: error
        } as ApiError);
      }

      // Log the change
      await supabase.from('timetable_change_logs').insert([{
        timetable_id: id,
        changed_by: deleted_by ? Number(deleted_by) : null,
        change_type: 'archived',
        change_description: `Timetable "${existingTimetable.name}" archived`,
        old_values: { status: existingTimetable.status, is_active: true },
        new_values: { status: 'archived', is_active: false }
      }]);
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: hard_delete === 'true' ? 'Timetable deleted successfully' : 'Timetable archived successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteTimetable:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * ============================================================================
 * SPECIALIZED TIMETABLE ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/timetables/:id/approve
 * Approve a timetable
 */
export const approveTimetable: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, approval_notes } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Approver faculty ID is required',
        status: 400
      } as ApiError);
    }

    // Validate approver exists
    const { data: approver, error: approverError } = await supabase
      .from('faculty')
      .select('id, name')
      .eq('id', approved_by)
      .eq('is_active', true)
      .single();

    if (!approver) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid approver faculty ID',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('timetables')
      .update({
        status: 'approved',
        approved_by: approved_by,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        approved_by_faculty:faculty!timetables_approved_by_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error approving timetable:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to approve timetable',
        status: 500,
        details: error
      } as ApiError);
    }

    // Log the approval
    await supabase.from('timetable_change_logs').insert([{
      timetable_id: id,
      changed_by: approved_by,
      change_type: 'approved',
      change_description: `Timetable approved by ${approver.name}`,
      change_reason: approval_notes,
      new_values: { status: 'approved', approved_by: approved_by }
    }]);

    const response: ApiResponse<Timetable> = {
      data,
      success: true,
      message: 'Timetable approved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in approveTimetable:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/timetables/:id/publish
 * Publish an approved timetable
 */
export const publishTimetable: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { published_by } = req.body;

    // Check if timetable is approved
    const { data: timetable, error: fetchError } = await supabase
      .from('timetables')
      .select('status, conflict_count')
      .eq('id', id)
      .single();

    if (!timetable) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Timetable not found',
        status: 404
      } as ApiError);
    }

    if (timetable.status !== 'approved') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Only approved timetables can be published',
        status: 400
      } as ApiError);
    }

    // Check for critical conflicts
    const { data: criticalConflicts, count } = await supabase
      .from('schedule_conflicts')
      .select('*', { count: 'exact' })
      .eq('timetable_id', id)
      .eq('severity', 'critical')
      .eq('status', 'open');

    if (count && count > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot publish timetable with unresolved critical conflicts',
        status: 400,
        details: {
          critical_conflicts: criticalConflicts
        }
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('timetables')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        created_by_faculty:faculty!timetables_created_by_fkey(*),
        approved_by_faculty:faculty!timetables_approved_by_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error publishing timetable:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to publish timetable',
        status: 500,
        details: error
      } as ApiError);
    }

    // Log the publication
    await supabase.from('timetable_change_logs').insert([{
      timetable_id: id,
      changed_by: published_by,
      change_type: 'published',
      change_description: 'Timetable published',
      new_values: { status: 'published' }
    }]);

    const response: ApiResponse<Timetable> = {
      data,
      success: true,
      message: 'Timetable published successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in publishTimetable:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/timetables/:id/detect-conflicts
 * Detect and analyze conflicts in a timetable
 */
export const detectConflicts: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all scheduled classes for this timetable
    const { data: scheduledClasses, error: classError } = await supabase
      .from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        classroom:classrooms(*)
      `)
      .eq('timetable_id', id);

    if (classError) {
      console.error('Error fetching scheduled classes:', classError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch scheduled classes',
        status: 500,
        details: classError
      } as ApiError);
    }

    const conflicts: ScheduleConflict[] = [];
    
    // Detect various types of conflicts
    const facultyConflicts = detectFacultyConflicts(scheduledClasses || []);
    const classroomConflicts = detectClassroomConflicts(scheduledClasses || []);
    const batchConflicts = detectBatchConflicts(scheduledClasses || []);
    
    conflicts.push(...facultyConflicts, ...classroomConflicts, ...batchConflicts);

    // Update conflict count in timetable
    await supabase
      .from('timetables')
      .update({ conflict_count: conflicts.length })
      .eq('id', id);

    // Clear existing conflicts and insert new ones
    await supabase.from('schedule_conflicts').delete().eq('timetable_id', id);
    
    if (conflicts.length > 0) {
      await supabase.from('schedule_conflicts').insert(
        conflicts.map(conflict => ({
          ...conflict,
          timetable_id: Number(id),
          detected_at: new Date().toISOString()
        }))
      );
    }

    const result: ConflictDetectionResult = {
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts,
      suggestions: generateConflictSuggestions(conflicts)
    };

    const response: ApiResponse<ConflictDetectionResult> = {
      data: result,
      success: true,
      message: `Conflict detection completed. Found ${conflicts.length} conflicts.`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in detectConflicts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

function calculateFacultyUtilization(classes: any[]): any {
  const facultyHours: { [key: number]: number } = {};
  
  classes.forEach(cls => {
    if (cls.faculty?.id && cls.time_slot?.duration_minutes) {
      facultyHours[cls.faculty.id] = (facultyHours[cls.faculty.id] || 0) + 
        (cls.time_slot.duration_minutes / 60);
    }
  });

  return facultyHours;
}

function calculateClassroomUtilization(classes: any[]): any {
  const classroomHours: { [key: number]: number } = {};
  
  classes.forEach(cls => {
    if (cls.classroom?.id && cls.time_slot?.duration_minutes) {
      classroomHours[cls.classroom.id] = (classroomHours[cls.classroom.id] || 0) + 
        (cls.time_slot.duration_minutes / 60);
    }
  });

  return classroomHours;
}

function calculateTimeDistribution(classes: any[]): any {
  const timeDistribution: { [key: string]: number } = {};
  
  classes.forEach(cls => {
    if (cls.time_slot?.day_of_week) {
      timeDistribution[cls.time_slot.day_of_week] = 
        (timeDistribution[cls.time_slot.day_of_week] || 0) + 1;
    }
  });

  return timeDistribution;
}

function calculateDepartmentDistribution(classes: any[]): any {
  const deptDistribution: { [key: string]: number } = {};
  
  classes.forEach(cls => {
    if (cls.subject?.department?.name) {
      deptDistribution[cls.subject.department.name] = 
        (deptDistribution[cls.subject.department.name] || 0) + 1;
    }
  });

  return deptDistribution;
}

function detectFacultyConflicts(classes: any[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const facultySchedule: { [key: string]: any[] } = {};

  classes.forEach(cls => {
    if (cls.faculty?.id && cls.time_slot) {
      const key = `${cls.faculty.id}_${cls.time_slot.day_of_week}_${cls.time_slot.start_time}`;
      if (!facultySchedule[key]) {
        facultySchedule[key] = [];
      }
      facultySchedule[key].push(cls);
    }
  });

  Object.entries(facultySchedule).forEach(([key, classList]) => {
    if (classList.length > 1) {
      conflicts.push({
        id: 0, // Will be set by database
        timetable_id: classList[0].timetable_id,
        conflict_type: 'faculty_double_booking',
        affected_classes: classList.map(c => c.id),
        conflict_description: `Faculty ${classList[0].faculty.name} has multiple classes scheduled at the same time`,
        severity: 'high',
        status: 'open',
        detected_at: new Date().toISOString()
      });
    }
  });

  return conflicts;
}

function detectClassroomConflicts(classes: any[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const classroomSchedule: { [key: string]: any[] } = {};

  classes.forEach(cls => {
    if (cls.classroom?.id && cls.time_slot) {
      const key = `${cls.classroom.id}_${cls.time_slot.day_of_week}_${cls.time_slot.start_time}`;
      if (!classroomSchedule[key]) {
        classroomSchedule[key] = [];
      }
      classroomSchedule[key].push(cls);
    }
  });

  Object.entries(classroomSchedule).forEach(([key, classList]) => {
    if (classList.length > 1) {
      conflicts.push({
        id: 0,
        timetable_id: classList[0].timetable_id,
        conflict_type: 'classroom_double_booking',
        affected_classes: classList.map(c => c.id),
        conflict_description: `Classroom ${classList[0].classroom.room_number} has multiple classes scheduled at the same time`,
        severity: 'high',
        status: 'open',
        detected_at: new Date().toISOString()
      });
    }
  });

  return conflicts;
}

function detectBatchConflicts(classes: any[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const batchSchedule: { [key: string]: any[] } = {};

  classes.forEach(cls => {
    if (cls.batch?.id && cls.time_slot) {
      const key = `${cls.batch.id}_${cls.time_slot.day_of_week}_${cls.time_slot.start_time}`;
      if (!batchSchedule[key]) {
        batchSchedule[key] = [];
      }
      batchSchedule[key].push(cls);
    }
  });

  Object.entries(batchSchedule).forEach(([key, classList]) => {
    if (classList.length > 1) {
      conflicts.push({
        id: 0,
        timetable_id: classList[0].timetable_id,
        conflict_type: 'batch_double_booking',
        affected_classes: classList.map(c => c.id),
        conflict_description: `Batch ${classList[0].batch.name} has multiple classes scheduled at the same time`,
        severity: 'critical',
        status: 'open',
        detected_at: new Date().toISOString()
      });
    }
  });

  return conflicts;
}

function generateConflictSuggestions(conflicts: ScheduleConflict[]): string[] {
  const suggestions: string[] = [];

  if (conflicts.some(c => c.conflict_type === 'faculty_double_booking')) {
    suggestions.push('Consider redistributing faculty assignments across different time slots');
  }

  if (conflicts.some(c => c.conflict_type === 'classroom_double_booking')) {
    suggestions.push('Review classroom capacity and consider using alternative rooms');
  }

  if (conflicts.some(c => c.conflict_type === 'batch_double_booking')) {
    suggestions.push('Batch conflicts require immediate attention - students cannot be in multiple places');
  }

  return suggestions;
}