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
import { getSupabaseAdminClient } from "@shared/supabase";
import { createEnhancedApiError, createPaginatedResponse } from "@shared/error-utils";

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

    const supabase = await getSupabaseAdminClient();
    let query = supabase.from('faculty')
      .select(`
        *
        ${include_department === 'true' ? `,department:departments(*)` : ''}
      `, { count: 'exact' });

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
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch faculty', error)
      );
    }

    const response = createPaginatedResponse<Faculty | FacultyWithDepartment>(
      data || [],
      Number(page),
      Number(limit),
      count || 0
    );

    res.json(response);
  } catch (error) {
    console.error('Error in getAllFaculty:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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

    const supabase = await getSupabaseAdminClient();
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
      .single() as { data: any; error: any };

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(
          createEnhancedApiError('NOT_FOUND', 'Faculty member not found')
        );
      }
      
      console.error('Error fetching faculty:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch faculty member', error)
      );
    }

    const response: ApiResponse<Faculty | FacultyWithDepartment> = {
      data,
      success: true,
      message: 'Faculty member retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getFacultyById:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Faculty name and employee ID are required')
      );
    }

    const supabase = await getSupabaseAdminClient();
    // Check for duplicate employee ID
    const { data: existingFaculty, error: checkError } = await supabase
      .from('faculty')
      .select('id')
      .eq('employee_id', facultyData.employee_id)
      .single() as { data: any; error: any };

    if (existingFaculty) {
      return res.status(409).json(
        createEnhancedApiError('CONFLICT', 'Employee ID already exists')
      );
    }

    // Validate department if provided
    if (facultyData.department_id) {
      const { data: deptExists, error: deptError } = await supabase.from('departments')
        .select('id')
        .eq('id', facultyData.department_id)
        .eq('is_active', true)
        .single() as { data: any; error: any };

      if (!deptExists) {
        return res.status(400).json(
          createEnhancedApiError('VALIDATION_ERROR', 'Invalid Department ID')
        );
      }
    }

    // Validate email format if provided
    if (facultyData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(facultyData.email)) {
        return res.status(400).json(
          createEnhancedApiError('VALIDATION_ERROR', 'Invalid email format')
        );
      }
    }

    const { data, error } = await supabase.from('faculty')
      .insert([{
        ...facultyData,
        experience_years: facultyData.experience_years || 0,
        max_weekly_hours: facultyData.max_weekly_hours || 20,
        is_active: true
      }] as any)
      .select(`
        *,
        department:departments(*)
      `)
      .single();

    if (error) {
      console.error('Error creating faculty:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to create faculty member', error)
      );
    }

    const response: ApiResponse<FacultyWithDepartment> = {
      data,
      success: true,
      message: 'Faculty member created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createFacultyMember:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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

    const supabase = await getSupabaseAdminClient();
    // Check if faculty exists
    const { data: existingFaculty, error: checkError } = await supabase
      .from('faculty')
      .select('id, employee_id')
      .eq('id', id)
      .single() as { data: any; error: any };

    if (!existingFaculty) {
      return res.status(404).json(
        createEnhancedApiError('NOT_FOUND', 'Faculty member not found')
      );
    }

    // Check for duplicate employee ID if being updated
    if (updateData.employee_id && updateData.employee_id !== existingFaculty.employee_id) {
      const { data: duplicateCheck } = await supabase.from('faculty')
        .select('id')
        .eq('employee_id', updateData.employee_id)
        .neq('id', id)
        .single() as { data: any; error: any };

      if (duplicateCheck) {
        return res.status(409).json(
          createEnhancedApiError('CONFLICT', 'Employee ID already exists')
        );
      }
    }

    // Validate department if provided
    if (updateData.department_id) {
      const { data: deptExists } = await supabase.from('departments')
        .select('id')
        .eq('id', updateData.department_id)
        .eq('is_active', true)
        .single() as { data: any; error: any };

      if (!deptExists) {
        return res.status(400).json(
          createEnhancedApiError('VALIDATION_ERROR', 'Invalid Department ID')
        );
      }
    }

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json(
          createEnhancedApiError('VALIDATION_ERROR', 'Invalid email format')
        );
      }
    }

    const updatePayload: any = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('faculty')
      // @ts-ignore - Supabase update type inference limitation
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        department:departments(*)
      `)
      .single();

    if (error) {
      console.error('Error updating faculty:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to update faculty member', error)
      );
    }

    const response: ApiResponse<FacultyWithDepartment> = {
      data,
      success: true,
      message: 'Faculty member updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateFacultyMember:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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

    const supabase = await getSupabaseAdminClient();
    // Check if faculty exists
    const { data: existingFaculty, error: checkError } = await supabase
      .from('faculty')
      .select('id, name')
      .eq('id', id)
      .single() as { data: any; error: any };

    if (!existingFaculty) {
      return res.status(404).json(
        createEnhancedApiError('NOT_FOUND', 'Faculty member not found')
      );
    }

    // Check if faculty is assigned as HOD
    const { data: hodCheck } = await supabase.from('departments')
      .select('id, name')
      .eq('head_of_department_id', id)
      .eq('is_active', true) as { data: any; error: any };

    if (hodCheck && hodCheck.length > 0) {
      return res.status(409).json(
        createEnhancedApiError('CONFLICT', 'Cannot delete faculty member who is Head of Department', {
          departments: hodCheck.map((dept: any) => dept.name)
        })
      );
    }

    // Check for active class assignments
    const { data: activeClasses } = await supabase.from('scheduled_classes')
      .select('id', { count: 'exact' }) as { data: any; error: any };
      
    if (hard_delete === 'true') {
      // Hard delete - only if no dependencies
      if (activeClasses && activeClasses.length > 0) {
        return res.status(409).json(
          createEnhancedApiError('CONFLICT', 'Cannot delete faculty member with active class assignments', {
            active_classes: activeClasses.length
          })
        );
      }

      const { error } = await supabase.from('faculty')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting faculty:', error);
        return res.status(500).json(
          createEnhancedApiError('DATABASE_ERROR', 'Failed to delete faculty member', error)
        );
      }
    } else {
      // Soft delete
      const softDeletePayload: any = {
        is_active: false,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('faculty')
        // @ts-ignore - Supabase update type inference limitation
        .update(softDeletePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating faculty:', error);
        return res.status(500).json(
          createEnhancedApiError('DATABASE_ERROR', 'Failed to deactivate faculty member', error)
        );
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
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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

    const supabase = await getSupabaseAdminClient();
    let query = supabase.from('faculty_subject_assignments')
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
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch faculty subject assignments', error)
      );
    }

    const response: ApiResponse<FacultySubjectAssignment[]> = {
      data: data || [],
      success: true,
      message: 'Faculty subject assignments retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getFacultySubjects:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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

    const supabase = await getSupabaseAdminClient();
    // Validate faculty exists
    const { data: faculty, error: facultyError } = await supabase.from('faculty')
      .select('id, name, max_weekly_hours')
      .eq('id', id)
      .eq('is_active', true)
      .single() as { data: any; error: any };

    if (!faculty) {
      return res.status(404).json(
        createEnhancedApiError('NOT_FOUND', 'Faculty member not found or inactive')
      );
    }

    // Validate subject exists
    const { data: subject, error: subjectError } = await supabase.from('subjects')
      .select('id, name, lectures_per_week, labs_per_week')
      .eq('id', assignmentData.subject_id)
      .single() as { data: any; error: any };

    if (!subject) {
      return res.status(404).json(
        createEnhancedApiError('NOT_FOUND', 'Subject not found')
      );
    }

    // Check for existing assignment
    const { data: existingAssignment } = await supabase.from('faculty_subject_assignments')
      .select('id')
      .eq('faculty_id', id)
      .eq('subject_id', assignmentData.subject_id)
      .eq('academic_year', assignmentData.academic_year || new Date().getFullYear().toString())
      .eq('is_active', true)
      .single() as { data: any; error: any };

    if (existingAssignment) {
      return res.status(409).json(
        createEnhancedApiError('CONFLICT', 'Faculty is already assigned to this subject for the academic year')
      );
    }

    // Check workload constraints
    const { data: currentAssignments } = await supabase.from('faculty_subject_assignments')
      .select('max_hours_per_week')
      .eq('faculty_id', id)
      .eq('is_active', true) as { data: any; error: any };

    const currentWorkload = currentAssignments?.reduce((sum: number, assignment: any) => sum + assignment.max_hours_per_week, 0) || 0;
    const newWorkload = assignmentData.max_hours_per_week || (subject.lectures_per_week + subject.labs_per_week);

    if (currentWorkload + newWorkload > faculty.max_weekly_hours) {
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Assignment would exceed faculty maximum weekly hours', {
          current_workload: currentWorkload,
          new_assignment_hours: newWorkload,
          max_weekly_hours: faculty.max_weekly_hours
        })
      );
    }

    const { data, error } = await supabase.from('faculty_subject_assignments')
      .insert([{
        ...assignmentData,
        proficiency_level: assignmentData.proficiency_level || 5,
        max_hours_per_week: newWorkload,
        assignment_type: assignmentData.assignment_type || 'regular',
        is_primary_instructor: assignmentData.is_primary_instructor || true,
        is_active: true
      }] as any)
      .select(`
        *,
        subject:subjects(*),
        faculty:faculty(*)
      `)
      .single();

    if (error) {
      console.error('Error creating faculty subject assignment:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to assign subject to faculty', error)
      );
    }

    const response: ApiResponse<FacultySubjectAssignment> = {
      data,
      success: true,
      message: 'Subject assigned to faculty successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in assignSubjectToFaculty:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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

    const supabase = await getSupabaseAdminClient();
    // Get faculty info
    const { data: faculty, error: facultyError } = await supabase.from('faculty')
      .select('id, name, max_weekly_hours')
      .eq('id', id)
      .single() as { data: any; error: any };

    if (!faculty) {
      return res.status(404).json(
        createEnhancedApiError('NOT_FOUND', 'Faculty member not found')
      );
    }

    // Get current assignments
    let assignmentsQuery = supabase.from('faculty_subject_assignments')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('faculty_id', id)
      .eq('is_active', true);

    if (academic_year) {
      assignmentsQuery = assignmentsQuery.eq('academic_year', academic_year);
    }

    const { data: assignments } = await assignmentsQuery as { data: any; error: any };

    // Get scheduled classes
    let classesQuery = supabase.from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        timetable:timetables(*)
      `)
      .eq('faculty_id', id);

    const { data: scheduledClasses } = await classesQuery as { data: any; error: any };

    // Calculate workload statistics
    const assignedHours = assignments?.reduce((sum: number, assignment: any) => sum + assignment.max_hours_per_week, 0) || 0;
    const scheduledHours = scheduledClasses?.reduce((sum: number, cls: any) => {
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
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};









