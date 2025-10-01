import { RequestHandler } from "express";
import { ApiResponse, ApiError, PaginatedResponse } from "@shared/enhanced-api";
import { 
  Department, 
  CreateDepartmentRequest, 
  UpdateDepartmentRequest,
  DepartmentWithStats,
  FacultyWithDepartment,
  QueryOptions
} from "@shared/database-types";
import { supabase } from "@shared/supabase";

/**
 * ============================================================================
 * DEPARTMENT CRUD OPERATIONS
 * Complete department management with validation and relationship handling
 * ============================================================================
 */

/**
 * GET /api/departments
 * Retrieve all departments with optional filtering, sorting, and pagination
 */
export const getDepartments: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      is_active,
      include_stats,
      sort_by = 'name',
      sort_order = 'asc'
    } = req.query;

    let query = supabase
      .from('departments')
      .select(`
        *,
        ${include_stats === 'true' ? `
          faculty_count:faculty(count),
          subject_count:subjects(count),
          active_timetables_count:timetables(count).eq(is_active, true)
        ` : ''}
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
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
      console.error('Error fetching departments:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch departments',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: PaginatedResponse<Department | DepartmentWithStats> = {
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
    console.error('Error in getDepartments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/departments/:id
 * Retrieve a specific department by ID with optional related data
 */
export const getDepartmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_hod, include_stats, include_faculty } = req.query;

    let selectQuery = `
      *
      ${include_hod === 'true' ? `,head_of_department:faculty!departments_head_of_department_id_fkey(*)` : ''}
      ${include_stats === 'true' ? `,
        faculty_count:faculty(count),
        subject_count:subjects(count),
        batch_count:student_batches(count),
        active_timetables_count:timetables(count).eq(is_active, true)
      ` : ''}
      ${include_faculty === 'true' ? `,faculty(*)` : ''}
    `;

    const { data, error } = await supabase
      .from('departments')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Department not found',
          status: 404
        } as ApiError);
      }
      
      console.error('Error fetching department:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch department',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<Department | DepartmentWithStats> = {
      data,
      success: true,
      message: 'Department retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getDepartmentById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/departments
 * Create a new department with validation
 */
export const createDepartment: RequestHandler = async (req, res) => {
  try {
    const departmentData: CreateDepartmentRequest = req.body;

    // Validation
    if (!departmentData.name || !departmentData.code) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Department name and code are required',
        status: 400
      } as ApiError);
    }

    // Check for duplicate code
    const { data: existingDept, error: checkError } = await supabase
      .from('departments')
      .select('id')
      .eq('code', departmentData.code)
      .single();

    if (existingDept) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Department code already exists',
        status: 409
      } as ApiError);
    }

    // Validate HOD if provided
    if (departmentData.head_of_department_id) {
      const { data: hodExists, error: hodError } = await supabase
        .from('faculty')
        .select('id')
        .eq('id', departmentData.head_of_department_id)
        .eq('is_active', true)
        .single();

      if (!hodExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Head of Department ID',
          status: 400
        } as ApiError);
      }
    }

    const { data, error } = await supabase
      .from('departments')
      .insert([{
        ...departmentData,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating department:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create department',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<Department> = {
      data,
      success: true,
      message: 'Department created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createDepartment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * PUT /api/departments/:id
 * Update an existing department
 */
export const updateDepartment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateDepartmentRequest = req.body;

    // Check if department exists
    const { data: existingDept, error: checkError } = await supabase
      .from('departments')
      .select('id, code')
      .eq('id', id)
      .single();

    if (!existingDept) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found',
        status: 404
      } as ApiError);
    }

    // Check for duplicate code if code is being updated
    if (updateData.code && updateData.code !== existingDept.code) {
      const { data: duplicateCheck } = await supabase
        .from('departments')
        .select('id')
        .eq('code', updateData.code)
        .neq('id', id)
        .single();

      if (duplicateCheck) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Department code already exists',
          status: 409
        } as ApiError);
      }
    }

    // Validate HOD if provided
    if (updateData.head_of_department_id) {
      const { data: hodExists } = await supabase
        .from('faculty')
        .select('id')
        .eq('id', updateData.head_of_department_id)
        .eq('is_active', true)
        .single();

      if (!hodExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Head of Department ID',
          status: 400
        } as ApiError);
      }
    }

    const { data, error } = await supabase
      .from('departments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating department:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update department',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<Department> = {
      data,
      success: true,
      message: 'Department updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * DELETE /api/departments/:id
 * Soft delete a department (set is_active to false)
 */
export const deleteDepartment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    // Check if department exists
    const { data: existingDept, error: checkError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existingDept) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found',
        status: 404
      } as ApiError);
    }

    // Check for dependencies before deletion
    const { data: facultyCount } = await supabase
      .from('faculty')
      .select('id', { count: 'exact' })
      .eq('department_id', id)
      .eq('is_active', true);

    const { data: subjectCount } = await supabase
      .from('subjects')
      .select('id', { count: 'exact' })
      .eq('department_id', id);

    const { data: batchCount } = await supabase
      .from('student_batches')
      .select('id', { count: 'exact' })
      .eq('department_id', id)
      .eq('is_active', true);

    if (hard_delete === 'true') {
      // Hard delete - only if no dependencies
      if (facultyCount?.length || subjectCount?.length || batchCount?.length) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete department with active faculty, subjects, or batches',
          status: 409,
          details: {
            faculty_count: facultyCount?.length || 0,
            subject_count: subjectCount?.length || 0,
            batch_count: batchCount?.length || 0
          }
        } as ApiError);
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting department:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete department',
          status: 500,
          details: error
        } as ApiError);
      }
    } else {
      // Soft delete
      const { data, error } = await supabase
        .from('departments')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating department:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to deactivate department',
          status: 500,
          details: error
        } as ApiError);
      }
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: hard_delete === 'true' ? 'Department deleted successfully' : 'Department deactivated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * ============================================================================
 * SPECIALIZED DEPARTMENT ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/departments/:id/assign-hod
 * Assign or change Head of Department
 */
export const assignHOD: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Faculty ID is required',
        status: 400
      } as ApiError);
    }

    // Validate faculty exists and is active
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('id, name, department_id')
      .eq('id', faculty_id)
      .eq('is_active', true)
      .single();

    if (!faculty) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid or inactive faculty member',
        status: 400
      } as ApiError);
    }

    // Check if faculty belongs to the department
    if (faculty.department_id && faculty.department_id !== Number(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Faculty member must belong to the department',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('departments')
      .update({
        head_of_department_id: faculty_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        head_of_department:faculty!departments_head_of_department_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error assigning HOD:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to assign Head of Department',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<Department> = {
      data,
      success: true,
      message: `${faculty.name} assigned as Head of Department successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in assignHOD:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/departments/:id/faculty
 * Get all faculty members in a department
 */
export const getDepartmentFaculty: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { active_only = 'true' } = req.query;

    let query = supabase
      .from('faculty')
      .select('*')
      .eq('department_id', id);

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching department faculty:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch department faculty',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<FacultyWithDepartment[]> = {
      data: data || [],
      success: true,
      message: 'Department faculty retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getDepartmentFaculty:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/departments/:id/statistics
 * Get comprehensive department statistics
 */
export const getDepartmentStatistics: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, semester } = req.query;

    // Get basic department info
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (!department) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found',
        status: 404
      } as ApiError);
    }

    // Get various statistics
    const [
      { count: facultyCount },
      { count: activeSubjectCount },
      { count: activeBatchCount },
      { count: activeTimetableCount }
    ] = await Promise.all([
      supabase.from('faculty').select('*', { count: 'exact', head: true }).eq('department_id', id).eq('is_active', true),
      supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('department_id', id),
      supabase.from('student_batches').select('*', { count: 'exact', head: true }).eq('department_id', id).eq('is_active', true),
      supabase.from('timetables').select('*', { count: 'exact', head: true }).eq('department_id', id).eq('is_active', true)
    ]);

    const statistics = {
      department,
      faculty_count: facultyCount || 0,
      subject_count: activeSubjectCount || 0,
      batch_count: activeBatchCount || 0,
      timetable_count: activeTimetableCount || 0,
      generated_at: new Date().toISOString()
    };

    const response: ApiResponse<typeof statistics> = {
      data: statistics,
      success: true,
      message: 'Department statistics retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getDepartmentStatistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};