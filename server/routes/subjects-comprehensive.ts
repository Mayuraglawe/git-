import { RequestHandler } from "express";
import { ApiResponse, ApiError, PaginatedResponse } from "@shared/enhanced-api";
import { 
  Subject, 
  CreateSubjectRequest, 
  UpdateSubjectRequest,
  SubjectWithDepartment,
  FacultySubjectAssignment,
  BatchSubjectAssignment,
  QueryOptions
} from "@shared/database-types";
import { supabase } from "@shared/supabase";

/**
 * ============================================================================
 * SUBJECT CRUD OPERATIONS
 * Complete subject management with department linking and prerequisite handling
 * ============================================================================
 */

/**
 * GET /api/subjects
 * Retrieve all subjects with filtering, sorting, and pagination
 */
export const getAllSubjects: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      department_id,
      semester,
      year,
      subject_type,
      requires_lab,
      credits_min,
      credits_max,
      sort_by = 'name',
      sort_order = 'asc',
      include_department
    } = req.query;

    let query = supabase
      .from('subjects')
      .select(`
        *
        ${include_department === 'true' ? `,department:departments(*)` : ''}
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,syllabus.ilike.%${search}%`);
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    if (year) {
      query = query.eq('year', Number(year));
    }

    if (subject_type) {
      query = query.eq('subject_type', subject_type);
    }

    if (requires_lab !== undefined) {
      query = query.eq('requires_lab', requires_lab === 'true');
    }

    if (credits_min) {
      query = query.gte('credits', Number(credits_min));
    }

    if (credits_max) {
      query = query.lte('credits', Number(credits_max));
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch subjects',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: PaginatedResponse<Subject | SubjectWithDepartment> = {
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
    console.error('Error in getAllSubjects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/subjects/:id
 * Retrieve a specific subject by ID with optional related data
 */
export const getSubjectById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_department, include_faculty, include_batches, include_prerequisites } = req.query;

    let selectQuery = `
      *
      ${include_department === 'true' ? `,department:departments(*)` : ''}
      ${include_faculty === 'true' ? `,
        faculty_subject_assignments(
          *,
          faculty:faculty(*)
        )
      ` : ''}
      ${include_batches === 'true' ? `,
        batch_subject_assignments(
          *,
          batch:student_batches(*)
        )
      ` : ''}
    `;

    const { data, error } = await supabase
      .from('subjects')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Subject not found',
          status: 404
        } as ApiError);
      }
      
      console.error('Error fetching subject:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch subject',
        status: 500,
        details: error
      } as ApiError);
    }

    // Parse prerequisites if requested
    if (include_prerequisites === 'true' && data.prerequisites) {
      try {
        const prerequisiteIds = JSON.parse(data.prerequisites);
        if (Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
          const { data: prerequisiteSubjects } = await supabase
            .from('subjects')
            .select('id, name, code')
            .in('id', prerequisiteIds);
          
          data.prerequisite_subjects = prerequisiteSubjects;
        }
      } catch (e) {
        console.warn('Failed to parse prerequisites:', data.prerequisites);
      }
    }

    const response: ApiResponse<Subject | SubjectWithDepartment> = {
      data,
      success: true,
      message: 'Subject retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getSubjectById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/subjects
 * Create a new subject with validation
 */
export const createSubject: RequestHandler = async (req, res) => {
  try {
    const subjectData: CreateSubjectRequest = req.body;

    // Validation
    if (!subjectData.name || !subjectData.code || !subjectData.department_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Subject name, code, and department ID are required',
        status: 400
      } as ApiError);
    }

    // Check for duplicate code within department
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', subjectData.code)
      .eq('department_id', subjectData.department_id)
      .single();

    if (existingSubject) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Subject code already exists in this department',
        status: 409
      } as ApiError);
    }

    // Validate department exists
    const { data: deptExists, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('id', subjectData.department_id)
      .eq('is_active', true)
      .single();

    if (!deptExists) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid Department ID',
        status: 400
      } as ApiError);
    }

    // Validate prerequisites if provided
    if (subjectData.prerequisites) {
      try {
        const prerequisiteIds = JSON.parse(subjectData.prerequisites);
        if (Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
          const { data: validPrereqs, count } = await supabase
            .from('subjects')
            .select('id', { count: 'exact' })
            .in('id', prerequisiteIds);

          if (count !== prerequisiteIds.length) {
            return res.status(400).json({
              error: 'Validation Error',
              message: 'One or more prerequisite subjects not found',
              status: 400
            } as ApiError);
          }
        }
      } catch (e) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Prerequisites must be a valid JSON array of subject IDs',
          status: 400
        } as ApiError);
      }
    }

    // Validate credits and hours
    if (subjectData.credits && subjectData.credits < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Credits must be non-negative',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert([{
        ...subjectData,
        lectures_per_week: subjectData.lectures_per_week || 0,
        labs_per_week: subjectData.labs_per_week || 0,
        requires_lab: subjectData.requires_lab || false,
        subject_type: subjectData.subject_type || 'core'
      }])
      .select(`
        *,
        department:departments(*)
      `)
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create subject',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<SubjectWithDepartment> = {
      data,
      success: true,
      message: 'Subject created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createSubject:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * PUT /api/subjects/:id
 * Update an existing subject
 */
export const updateSubject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateSubjectRequest = req.body;

    // Check if subject exists
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('id, code, department_id')
      .eq('id', id)
      .single();

    if (!existingSubject) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subject not found',
        status: 404
      } as ApiError);
    }

    // Check for duplicate code if being updated
    if (updateData.code && updateData.code !== existingSubject.code) {
      const deptId = updateData.department_id || existingSubject.department_id;
      const { data: duplicateCheck } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', updateData.code)
        .eq('department_id', deptId)
        .neq('id', id)
        .single();

      if (duplicateCheck) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Subject code already exists in this department',
          status: 409
        } as ApiError);
      }
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

    // Validate prerequisites if provided
    if (updateData.prerequisites) {
      try {
        const prerequisiteIds = JSON.parse(updateData.prerequisites);
        if (Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
          const { data: validPrereqs, count } = await supabase
            .from('subjects')
            .select('id', { count: 'exact' })
            .in('id', prerequisiteIds);

          if (count !== prerequisiteIds.length) {
            return res.status(400).json({
              error: 'Validation Error',
              message: 'One or more prerequisite subjects not found',
              status: 400
            } as ApiError);
          }
        }
      } catch (e) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Prerequisites must be a valid JSON array of subject IDs',
          status: 400
        } as ApiError);
      }
    }

    const { data, error } = await supabase
      .from('subjects')
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
      console.error('Error updating subject:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update subject',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<SubjectWithDepartment> = {
      data,
      success: true,
      message: 'Subject updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateSubject:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * DELETE /api/subjects/:id
 * Delete a subject (hard delete only if no dependencies)
 */
export const deleteSubject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subject exists
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existingSubject) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subject not found',
        status: 404
      } as ApiError);
    }

    // Check for dependencies
    const [
      { count: facultyAssignments },
      { count: batchAssignments },
      { count: scheduledClasses }
    ] = await Promise.all([
      supabase.from('faculty_subject_assignments').select('*', { count: 'exact', head: true }).eq('subject_id', id).eq('is_active', true),
      supabase.from('batch_subject_assignments').select('*', { count: 'exact', head: true }).eq('subject_id', id),
      supabase.from('scheduled_classes').select('*', { count: 'exact', head: true }).eq('subject_id', id)
    ]);

    if ((facultyAssignments || 0) > 0 || (batchAssignments || 0) > 0 || (scheduledClasses || 0) > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete subject with existing assignments or scheduled classes',
        status: 409,
        details: {
          faculty_assignments: facultyAssignments || 0,
          batch_assignments: batchAssignments || 0,
          scheduled_classes: scheduledClasses || 0
        }
      } as ApiError);
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subject:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete subject',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Subject deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteSubject:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * ============================================================================
 * SPECIALIZED SUBJECT ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/subjects/:id/faculty
 * Get all faculty assigned to a subject
 */
export const getSubjectFaculty: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { active_only = 'true', academic_year } = req.query;

    let query = supabase
      .from('faculty_subject_assignments')
      .select(`
        *,
        faculty:faculty(*)
      `)
      .eq('subject_id', id);

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    query = query.order('is_primary_instructor', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subject faculty:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch subject faculty',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<FacultySubjectAssignment[]> = {
      data: data || [],
      success: true,
      message: 'Subject faculty retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getSubjectFaculty:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/subjects/:id/batches
 * Get all batches assigned to a subject
 */
export const getSubjectBatches: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, semester } = req.query;

    let query = supabase
      .from('batch_subject_assignments')
      .select(`
        *,
        batch:student_batches(*)
      `)
      .eq('subject_id', id);

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subject batches:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch subject batches',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<BatchSubjectAssignment[]> = {
      data: data || [],
      success: true,
      message: 'Subject batches retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getSubjectBatches:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/subjects/:id/prerequisites
 * Get prerequisite subjects with details
 */
export const getSubjectPrerequisites: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('prerequisites')
      .eq('id', id)
      .single();

    if (!subject) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subject not found',
        status: 404
      } as ApiError);
    }

    let prerequisites = [];

    if (subject.prerequisites) {
      try {
        const prerequisiteIds = JSON.parse(subject.prerequisites);
        if (Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
          const { data: prerequisiteSubjects, error } = await supabase
            .from('subjects')
            .select(`
              *,
              department:departments(*)
            `)
            .in('id', prerequisiteIds);

          if (error) {
            console.error('Error fetching prerequisite subjects:', error);
            return res.status(500).json({
              error: 'Database Error',
              message: 'Failed to fetch prerequisite subjects',
              status: 500,
              details: error
            } as ApiError);
          }

          prerequisites = prerequisiteSubjects || [];
        }
      } catch (e) {
        console.warn('Failed to parse prerequisites:', subject.prerequisites);
      }
    }

    const response: ApiResponse<SubjectWithDepartment[]> = {
      data: prerequisites,
      success: true,
      message: 'Subject prerequisites retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getSubjectPrerequisites:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/subjects/by-department/:departmentId
 * Get all subjects for a specific department
 */
export const getSubjectsByDepartment: RequestHandler = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { semester, year, subject_type, include_stats } = req.query;

    let query = supabase
      .from('subjects')
      .select(`
        *
        ${include_stats === 'true' ? `,
          faculty_count:faculty_subject_assignments(count).eq(is_active, true),
          batch_count:batch_subject_assignments(count)
        ` : ''}
      `)
      .eq('department_id', departmentId);

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    if (year) {
      query = query.eq('year', Number(year));
    }

    if (subject_type) {
      query = query.eq('subject_type', subject_type);
    }

    query = query.order('year').order('semester').order('name');

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subjects by department:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch subjects by department',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<Subject[]> = {
      data: data || [],
      success: true,
      message: 'Department subjects retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getSubjectsByDepartment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};