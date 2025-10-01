import { RequestHandler } from "express";
import { ApiResponse, ApiError, PaginatedResponse } from "@shared/enhanced-api";
import { 
  Faculty, 
  CreateFacultyRequest, 
  UpdateFacultyRequest,
  FacultyWithDepartment,
  FacultySubjectAssignment,
  CreateFacultySubjectAssignmentRequest,
  QueryOptions
} from "@shared/database-types";
import { supabase } from "@shared/supabase";

/**
 * ============================================================================
 * FACULTY CRUD OPERATIONS
 * Complete faculty management with department assignment and workload tracking
 * ============================================================================
 */

/**
 * GET /api/faculty
 * Retrieve all faculty with filtering, sorting, and pagination
 */
export const getAllFaculty: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      department_id,
      is_active,
      designation,
      experience_min,
      experience_max,
      sort_by = 'name',
      sort_order = 'asc',
      include_department
    } = req.query;

    let query = supabase
      .from('faculty')
      .select(`
        *
        ${include_department === 'true' ? `,department:departments(*)` : ''}
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%,email.ilike.%${search}%,designation.ilike.%${search}%`);
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (designation) {
      query = query.eq('designation', designation);
    }

    if (experience_min) {
      query = query.gte('experience_years', Number(experience_min));
    }

    if (experience_max) {
      query = query.lte('experience_years', Number(experience_max));
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching faculty:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch faculty',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: PaginatedResponse<Faculty | FacultyWithDepartment> = {
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
    console.error('Error in getAllFaculty:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/faculty/:id
 * Retrieve a specific faculty member by ID with optional related data
 */
export const getFacultyById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_department, include_subjects, include_assignments, include_workload } = req.query;

    let selectQuery = `
      *
      ${include_department === 'true' ? `,department:departments(*)` : ''}
      ${include_subjects === 'true' ? `,
        faculty_subject_assignments(
          *,
          subject:subjects(*)
        )
      ` : ''}
      ${include_workload === 'true' ? `,
        current_classes:scheduled_classes(count).eq(faculty_id, ${id}),
        weekly_hours:scheduled_classes(
          time_slot:time_slots(duration_minutes)
        ).eq(faculty_id, ${id})
      ` : ''}
    `;

    const { data, error } = await supabase
      .from('faculty')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Faculty member not found',
          status: 404
        } as ApiError);
      }
      
      console.error('Error fetching faculty:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch faculty member',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<Faculty | FacultyWithDepartment> = {
      data,
      success: true,
      message: 'Faculty member retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getFacultyById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/faculty
 * Create a new faculty member with validation
 */
export const createFacultyMember: RequestHandler = async (req, res) => {
  try {
    const facultyData: CreateFacultyRequest = req.body;

    // Validation
    if (!facultyData.name || !facultyData.employee_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Faculty name and employee ID are required',
        status: 400
      } as ApiError);
    }

    // Check for duplicate employee ID
    const { data: existingFaculty, error: checkError } = await supabase
      .from('faculty')
      .select('id')
      .eq('employee_id', facultyData.employee_id)
      .single();

    if (existingFaculty) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Employee ID already exists',
        status: 409
      } as ApiError);
    }

    // Validate department if provided
    if (facultyData.department_id) {
      const { data: deptExists, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('id', facultyData.department_id)
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

    // Validate email format if provided
    if (facultyData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(facultyData.email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid email format',
          status: 400
        } as ApiError);
      }
    }

    const { data, error } = await supabase
      .from('faculty')
      .insert([{
        ...facultyData,
        experience_years: facultyData.experience_years || 0,
        max_weekly_hours: facultyData.max_weekly_hours || 20,
        is_active: true
      }])
      .select(`
        *,
        department:departments(*)
      `)
      .single();

    if (error) {
      console.error('Error creating faculty:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create faculty member',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<FacultyWithDepartment> = {
      data,
      success: true,
      message: 'Faculty member created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createFacultyMember:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * PUT /api/faculty/:id
 * Update an existing faculty member
 */
export const updateFacultyMember: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateFacultyRequest = req.body;

    // Check if faculty exists
    const { data: existingFaculty, error: checkError } = await supabase
      .from('faculty')
      .select('id, employee_id')
      .eq('id', id)
      .single();

    if (!existingFaculty) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Faculty member not found',
        status: 404
      } as ApiError);
    }

    // Check for duplicate employee ID if being updated
    if (updateData.employee_id && updateData.employee_id !== existingFaculty.employee_id) {
      const { data: duplicateCheck } = await supabase
        .from('faculty')
        .select('id')
        .eq('employee_id', updateData.employee_id)
        .neq('id', id)
        .single();

      if (duplicateCheck) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Employee ID already exists',
          status: 409
        } as ApiError);
      }
    }

    // Validate department if provided
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

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid email format',
          status: 400
        } as ApiError);
      }
    }

    const { data, error } = await supabase
      .from('faculty')
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
      console.error('Error updating faculty:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update faculty member',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<FacultyWithDepartment> = {
      data,
      success: true,
      message: 'Faculty member updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateFacultyMember:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * DELETE /api/faculty/:id
 * Soft delete a faculty member (set is_active to false)
 */
export const deleteFacultyMember: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    // Check if faculty exists
    const { data: existingFaculty, error: checkError } = await supabase
      .from('faculty')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existingFaculty) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Faculty member not found',
        status: 404
      } as ApiError);
    }

    // Check if faculty is assigned as HOD
    const { data: hodCheck } = await supabase
      .from('departments')
      .select('id, name')
      .eq('head_of_department_id', id)
      .eq('is_active', true);

    if (hodCheck && hodCheck.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete faculty member who is Head of Department',
        status: 409,
        details: {
          departments: hodCheck.map(dept => dept.name)
        }
      } as ApiError);
    }

    // Check for active class assignments
    const { data: activeClasses } = await supabase
      .from('scheduled_classes')
      .select('id', { count: 'exact' })
      .eq('faculty_id', id);

    if (hard_delete === 'true') {
      // Hard delete - only if no dependencies
      if (activeClasses && activeClasses.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete faculty member with active class assignments',
          status: 409,
          details: {
            active_classes: activeClasses.length
          }
        } as ApiError);
      }

      const { error } = await supabase
        .from('faculty')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting faculty:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete faculty member',
          status: 500,
          details: error
        } as ApiError);
      }
    } else {
      // Soft delete
      const { data, error } = await supabase
        .from('faculty')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating faculty:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to deactivate faculty member',
          status: 500,
          details: error
        } as ApiError);
      }
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: hard_delete === 'true' ? 'Faculty member deleted successfully' : 'Faculty member deactivated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteFacultyMember:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * ============================================================================
 * FACULTY SUBJECT ASSIGNMENT MANAGEMENT
 * ============================================================================
 */

/**
 * GET /api/faculty/:id/subjects
 * Get all subject assignments for a faculty member
 */
export const getFacultySubjects: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, active_only = 'true' } = req.query;

    let query = supabase
      .from('faculty_subject_assignments')
      .select(`
        *,
        subject:subjects(*),
        faculty:faculty(*)
      `)
      .eq('faculty_id', id);

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching faculty subjects:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch faculty subject assignments',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<FacultySubjectAssignment[]> = {
      data: data || [],
      success: true,
      message: 'Faculty subject assignments retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getFacultySubjects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/faculty/:id/subjects
 * Assign a subject to a faculty member
 */
export const assignSubjectToFaculty: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentData: CreateFacultySubjectAssignmentRequest = {
      ...req.body,
      faculty_id: Number(id)
    };

    // Validate faculty exists
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('id, name, max_weekly_hours')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (!faculty) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Faculty member not found or inactive',
        status: 404
      } as ApiError);
    }

    // Validate subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, lectures_per_week, labs_per_week')
      .eq('id', assignmentData.subject_id)
      .single();

    if (!subject) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subject not found',
        status: 404
      } as ApiError);
    }

    // Check for existing assignment
    const { data: existingAssignment } = await supabase
      .from('faculty_subject_assignments')
      .select('id')
      .eq('faculty_id', id)
      .eq('subject_id', assignmentData.subject_id)
      .eq('academic_year', assignmentData.academic_year || new Date().getFullYear().toString())
      .eq('is_active', true)
      .single();

    if (existingAssignment) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Faculty is already assigned to this subject for the academic year',
        status: 409
      } as ApiError);
    }

    // Check workload constraints
    const { data: currentAssignments } = await supabase
      .from('faculty_subject_assignments')
      .select('max_hours_per_week')
      .eq('faculty_id', id)
      .eq('is_active', true);

    const currentWorkload = currentAssignments?.reduce((sum, assignment) => sum + assignment.max_hours_per_week, 0) || 0;
    const newWorkload = assignmentData.max_hours_per_week || (subject.lectures_per_week + subject.labs_per_week);

    if (currentWorkload + newWorkload > faculty.max_weekly_hours) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Assignment would exceed faculty maximum weekly hours',
        status: 400,
        details: {
          current_workload: currentWorkload,
          new_assignment_hours: newWorkload,
          max_weekly_hours: faculty.max_weekly_hours
        }
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('faculty_subject_assignments')
      .insert([{
        ...assignmentData,
        proficiency_level: assignmentData.proficiency_level || 5,
        max_hours_per_week: newWorkload,
        assignment_type: assignmentData.assignment_type || 'regular',
        is_primary_instructor: assignmentData.is_primary_instructor || true,
        is_active: true
      }])
      .select(`
        *,
        subject:subjects(*),
        faculty:faculty(*)
      `)
      .single();

    if (error) {
      console.error('Error creating faculty subject assignment:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to assign subject to faculty',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<FacultySubjectAssignment> = {
      data,
      success: true,
      message: 'Subject assigned to faculty successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in assignSubjectToFaculty:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/faculty/:id/workload
 * Get faculty workload statistics
 */
export const getFacultyWorkload: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, semester } = req.query;

    // Get faculty info
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('id, name, max_weekly_hours')
      .eq('id', id)
      .single();

    if (!faculty) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Faculty member not found',
        status: 404
      } as ApiError);
    }

    // Get current assignments
    let assignmentsQuery = supabase
      .from('faculty_subject_assignments')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('faculty_id', id)
      .eq('is_active', true);

    if (academic_year) {
      assignmentsQuery = assignmentsQuery.eq('academic_year', academic_year);
    }

    const { data: assignments } = await assignmentsQuery;

    // Get scheduled classes
    let classesQuery = supabase
      .from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        timetable:timetables(*)
      `)
      .eq('faculty_id', id);

    const { data: scheduledClasses } = await classesQuery;

    // Calculate workload statistics
    const assignedHours = assignments?.reduce((sum, assignment) => sum + assignment.max_hours_per_week, 0) || 0;
    const scheduledHours = scheduledClasses?.reduce((sum, cls) => {
      return sum + (cls.time_slot?.duration_minutes || 0) / 60;
    }, 0) || 0;

    const workload = {
      faculty: {
        id: faculty.id,
        name: faculty.name,
        max_weekly_hours: faculty.max_weekly_hours
      },
      assignments: assignments || [],
      scheduled_classes: scheduledClasses || [],
      statistics: {
        assigned_hours: assignedHours,
        scheduled_hours: scheduledHours,
        available_hours: faculty.max_weekly_hours - assignedHours,
        utilization_percentage: Math.round((assignedHours / faculty.max_weekly_hours) * 100),
        subject_count: assignments?.length || 0,
        class_count: scheduledClasses?.length || 0
      }
    };

    const response: ApiResponse<typeof workload> = {
      data: workload,
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
    } as ApiError);
  }
};