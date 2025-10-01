import { RequestHandler } from "express";
import { 
  FacultySubjectAssignment, 
  CollegeEvent,
  CreateFacultySubjectAssignmentRequest, 
  CreateCollegeEventRequest,
  UpdateCollegeEventRequest,
  BatchSubjectAssignment,
  CreateBatchSubjectAssignmentRequest,
  ApiResponse,
  PaginatedResponse
} from "@shared/database-types";
import { getSupabaseAdminClient } from "@shared/supabase";

const supabase = getSupabaseAdminClient() as any;

/**
 * ============================================================================
 * FACULTY-SUBJECT ASSIGNMENT CRUD OPERATIONS
 * ============================================================================
 */

/**
 * GET /api/faculty-assignments
 * Retrieve all faculty-subject assignments
 */
export const getAllFacultyAssignments: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      faculty_id,
      subject_id,
      academic_year,
      semester,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabase
      .from('faculty_subject_assignments')
      .select(`
        *,
        faculty:faculty(*),
        subject:subjects(*)
      `, { count: 'exact' });

    // Apply filters
    if (faculty_id) {
      query = query.eq('faculty_id', faculty_id);
    }

    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching faculty assignments:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch faculty assignments',
        status: 500,
        details: error
      } as any);
    }

    const response: PaginatedResponse<FacultySubjectAssignment> = {
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
    console.error('Error in getAllFacultyAssignments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * GET /api/assignments/:id
 * Retrieve a specific assignment by ID
 */
export const getAssignmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        faculty:faculty(*),
        batch:student_batches(*),
        subject:subjects(*),
        timetable:timetables(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Assignment not found',
          status: 404
        } as any);
      }
      
      console.error('Error fetching assignment:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch assignment',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<FacultySubjectAssignment> = {
      data,
      success: true,
      message: 'Assignment retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getAssignmentById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * POST /api/assignments
 * Create a new assignment with validation
 */
export const createAssignment: RequestHandler = async (req, res) => {
  try {
    const assignmentData: CreateAssignmentRequest = req.body;

    // Validation
    const requiredFields = ['subject_id', 'timetable_id', 'assignment_type'];
    const missingFields = requiredFields.filter(field => !assignmentData[field as keyof CreateAssignmentRequest]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        status: 400
      } as any);
    }

    // Validate assignment type specific requirements
    if (assignmentData.assignment_type === 'faculty_subject' && !assignmentData.faculty_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Faculty ID is required for faculty-subject assignments',
        status: 400
      } as any);
    }

    if (assignmentData.assignment_type === 'batch_subject' && !assignmentData.batch_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Batch ID is required for batch-subject assignments',
        status: 400
      } as any);
    }

    // Validate referenced entities exist
    const validationPromises = [
      supabase.from('subjects').select('id').eq('id', assignmentData.subject_id).single(),
      supabase.from('timetables').select('id').eq('id', assignmentData.timetable_id).single()
    ];

    if (assignmentData.faculty_id) {
      validationPromises.push(
        supabase.from('faculty').select('id').eq('id', assignmentData.faculty_id).eq('is_active', true).single()
      );
    }

    if (assignmentData.batch_id) {
      validationPromises.push(
        supabase.from('student_batches').select('id').eq('id', assignmentData.batch_id).eq('is_active', true).single()
      );
    }

    const [subject, timetable, ...otherResults] = await Promise.all(validationPromises);

    const validationErrors = [];
    if (!subject.data) validationErrors.push('Invalid subject ID');
    if (!timetable.data) validationErrors.push('Invalid timetable ID');
    
    let facultyIndex = -1, batchIndex = -1;
    if (assignmentData.faculty_id) {
      facultyIndex = assignmentData.batch_id ? 2 : 2;
      if (!otherResults[facultyIndex]?.data) validationErrors.push('Invalid or inactive faculty ID');
    }
    if (assignmentData.batch_id) {
      batchIndex = assignmentData.faculty_id ? (assignmentData.batch_id ? 3 : 2) : 2;
      if (!otherResults[batchIndex]?.data) validationErrors.push('Invalid or inactive batch ID');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationErrors.join(', '),
        status: 400
      } as any);
    }

    // Check for duplicate assignments
    let duplicateQuery = supabase
      .from('assignments')
      .select('id')
      .eq('subject_id', assignmentData.subject_id)
      .eq('timetable_id', assignmentData.timetable_id)
      .eq('assignment_type', assignmentData.assignment_type);

    if (assignmentData.faculty_id) {
      duplicateQuery = duplicateQuery.eq('faculty_id', assignmentData.faculty_id);
    }

    if (assignmentData.batch_id) {
      duplicateQuery = duplicateQuery.eq('batch_id', assignmentData.batch_id);
    }

    const { data: duplicates } = await duplicateQuery;

    if (duplicates && duplicates.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Duplicate assignment already exists',
        status: 409
      } as any);
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert([assignmentData])
      .select(`
        *,
        faculty:faculty(*),
        batch:student_batches(*),
        subject:subjects(*),
        timetable:timetables(*)
      `)
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create assignment',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<AssignmentWithDetails> = {
      data,
      success: true,
      message: 'Assignment created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createAssignment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * PUT /api/assignments/:id
 * Update an existing assignment
 */
export const updateAssignment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateAssignmentRequest = req.body;

    // Check if assignment exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingAssignment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Assignment not found',
        status: 404
      } as any);
    }

    // Validate referenced entities if they're being updated (similar to create)
    const validationPromises = [];
    if (updateData.subject_id) {
      validationPromises.push(supabase.from('subjects').select('id').eq('id', updateData.subject_id).single());
    }
    if (updateData.timetable_id) {
      validationPromises.push(supabase.from('timetables').select('id').eq('id', updateData.timetable_id).single());
    }
    if (updateData.faculty_id) {
      validationPromises.push(supabase.from('faculty').select('id').eq('id', updateData.faculty_id).eq('is_active', true).single());
    }
    if (updateData.batch_id) {
      validationPromises.push(supabase.from('student_batches').select('id').eq('id', updateData.batch_id).eq('is_active', true).single());
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

    const { data, error } = await supabase
      .from('assignments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        faculty:faculty(*),
        batch:student_batches(*),
        subject:subjects(*),
        timetable:timetables(*)
      `)
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update assignment',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<AssignmentWithDetails> = {
      data,
      success: true,
      message: 'Assignment updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateAssignment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * DELETE /api/assignments/:id
 * Delete an assignment
 */
export const deleteAssignment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignment exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingAssignment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Assignment not found',
        status: 404
      } as any);
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assignment:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete assignment',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Assignment deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteAssignment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * ============================================================================
 * EVENT CRUD OPERATIONS
 * College event management with conflict detection
 * ============================================================================
 */

/**
 * GET /api/events
 * Retrieve all events with filtering and pagination
 */
export const getAllEvents: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      event_type,
      department_id,
      academic_year,
      start_date,
      end_date,
      status = 'scheduled',
      sort_by = 'start_date',
      sort_order = 'asc'
    } = req.query;

    let query = supabase
      .from('events')
      .select(`
        *,
        department:departments(*)
      `, { count: 'exact' });

    // Apply filters
    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Date range filtering
    if (start_date) {
      query = query.gte('start_date', start_date);
    }

    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    // Apply sorting
    if (sort_by.includes('.')) {
      const [table, field] = sort_by.split('.');
      query = query.order(field, { foreignTable: table, ascending: sort_order === 'asc' });
    } else {
      query = query.order(sort_by as string, { ascending: sort_order === 'asc' });
    }

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch events',
        status: 500,
        details: error
      } as any);
    }

    const response: PaginatedResponse<EventWithDetails> = {
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
    console.error('Error in getAllEvents:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * GET /api/events/:id
 * Retrieve a specific event by ID
 */
export const getEventById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        department:departments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Event not found',
          status: 404
        } as any);
      }
      
      console.error('Error fetching event:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch event',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<EventWithDetails> = {
      data,
      success: true,
      message: 'Event retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getEventById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * POST /api/events
 * Create a new event with validation and conflict detection
 */
export const createEvent: RequestHandler = async (req, res) => {
  try {
    const eventData: CreateEventRequest = req.body;

    // Validation
    const requiredFields = ['title', 'event_type', 'start_date', 'end_date', 'academic_year'];
    const missingFields = requiredFields.filter(field => !eventData[field as keyof CreateEventRequest]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        status: 400
      } as any);
    }

    // Validate date logic
    const startDate = new Date(eventData.start_date);
    const endDate = new Date(eventData.end_date);

    if (endDate < startDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'End date must be after start date',
        status: 400
      } as any);
    }

    // Validate department if provided
    if (eventData.department_id) {
      const { data: department } = await supabase
        .from('departments')
        .select('id')
        .eq('id', eventData.department_id)
        .eq('is_active', true)
        .single();

      if (!department) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid or inactive department ID',
          status: 400
        } as any);
      }
    }

    // Check for date conflicts with existing events
    const { data: conflicts } = await supabase
      .from('events')
      .select('id, title, start_date, end_date')
      .neq('status', 'cancelled')
      .or(`and(start_date.lte.${eventData.start_date},end_date.gte.${eventData.start_date}),and(start_date.lte.${eventData.end_date},end_date.gte.${eventData.end_date}),and(start_date.gte.${eventData.start_date},end_date.lte.${eventData.end_date})`);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Event dates conflict with existing events',
        status: 409,
        details: { conflicting_events: conflicts }
      } as any);
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        status: eventData.status || 'scheduled'
      }])
      .select(`
        *,
        department:departments(*)
      `)
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create event',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<EventWithDetails> = {
      data,
      success: true,
      message: 'Event created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createEvent:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * PUT /api/events/:id
 * Update an existing event
 */
export const updateEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateEventRequest = req.body;

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingEvent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found',
        status: 404
      } as any);
    }

    // Validate date logic if dates are being updated
    if (updateData.start_date || updateData.end_date) {
      const startDate = new Date(updateData.start_date || existingEvent.start_date);
      const endDate = new Date(updateData.end_date || existingEvent.end_date);

      if (endDate < startDate) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'End date must be after start date',
          status: 400
        } as any);
      }
    }

    // Validate department if being updated
    if (updateData.department_id) {
      const { data: department } = await supabase
        .from('departments')
        .select('id')
        .eq('id', updateData.department_id)
        .eq('is_active', true)
        .single();

      if (!department) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid or inactive department ID',
          status: 400
        } as any);
      }
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(*)
      `)
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update event',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<EventWithDetails> = {
      data,
      success: true,
      message: 'Event updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateEvent:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * DELETE /api/events/:id
 * Delete an event
 */
export const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingEvent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found',
        status: 404
      } as any);
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete event',
        status: 500,
        details: error
      } as any);
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Event deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * ============================================================================
 * SPECIALIZED ASSIGNMENT & EVENT ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/assignments/faculty/:facultyId/workload
 * Get faculty workload summary
 */
export const getFacultyWorkload: RequestHandler = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { academic_year, semester } = req.query;

    let assignmentsQuery = supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects(*),
        timetable:timetables(*)
      `)
      .eq('faculty_id', facultyId)
      .eq('assignment_type', 'faculty_subject');

    // Apply timetable filters
    if (academic_year) {
      assignmentsQuery = assignmentsQuery.eq('timetable.academic_year', academic_year);
    }
    if (semester) {
      assignmentsQuery = assignmentsQuery.eq('timetable.semester', Number(semester));
    }

    const { data: assignments, error } = await assignmentsQuery;

    if (error) {
      console.error('Error fetching faculty workload:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch faculty workload',
        status: 500,
        details: error
      } as any);
    }

    // Calculate workload statistics
    const totalSubjects = assignments?.length || 0;
    const uniqueSubjects = new Set(assignments?.map(a => a.subject_id)).size;
    const totalCredits = assignments?.reduce((sum, a) => sum + (a.subject?.credits || 0), 0) || 0;

    const response: ApiResponse<{
      assignments: typeof assignments;
      statistics: {
        total_assignments: number;
        unique_subjects: number;
        total_credits: number;
      };
    }> = {
      data: {
        assignments: assignments || [],
        statistics: {
          total_assignments: totalSubjects,
          unique_subjects: uniqueSubjects,
          total_credits: totalCredits
        }
      },
      success: true,
      message: 'Faculty workload retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getFacultyWorkload:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};

/**
 * GET /api/events/calendar
 * Get events in calendar format
 */
export const getEventsCalendar: RequestHandler = async (req, res) => {
  try {
    const { year, month, department_id, event_type } = req.query;

    let query = supabase
      .from('events')
      .select(`
        *,
        department:departments(*)
      `)
      .neq('status', 'cancelled');

    // Apply filters
    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    // Date filtering for calendar view
    if (year && month) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
      query = query.gte('start_date', startDate).lte('start_date', endDate);
    } else if (year) {
      query = query.gte('start_date', `${year}-01-01`).lt('start_date', `${Number(year) + 1}-01-01`);
    }

    query = query.order('start_date');

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events calendar:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch events calendar',
        status: 500,
        details: error
      } as any);
    }

    // Group events by date for calendar display
    const calendar: { [key: string]: EventWithDetails[] } = {};
    events?.forEach(event => {
      const date = event.start_date.split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(event);
    });

    const response: ApiResponse<{
      calendar: typeof calendar;
      events: typeof events;
      total_events: number;
    }> = {
      data: {
        calendar,
        events: events || [],
        total_events: events?.length || 0
      },
      success: true,
      message: 'Events calendar retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getEventsCalendar:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as any);
  }
};