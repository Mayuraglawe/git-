import { RequestHandler } from "express";
import { ApiResponse, ApiError, PaginatedResponse } from "@shared/enhanced-api";
import { 
  StudentBatch, 
  CreateStudentBatchRequest, 
  UpdateStudentBatchRequest,
  BatchSubjectAssignment,
  CreateBatchSubjectAssignmentRequest,
  QueryOptions,
  Year,
  Semester
} from "@shared/database-types";
import { supabase } from "@shared/supabase";

/**
 * ============================================================================
 * STUDENT BATCH CRUD OPERATIONS
 * Complete batch management with coordinator assignment and academic progression
 * ============================================================================
 */

/**
 * GET /api/batches
 * Retrieve all student batches with filtering, sorting, and pagination
 */
export const getAllBatches: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      department_id,
      year,
      semester,
      academic_year,
      is_active,
      section,
      intake_year,
      sort_by = 'department_id,year,semester,section',
      sort_order = 'asc',
      include_department,
      include_coordinator
    } = req.query;

    let query = supabase
      .from('student_batches')
      .select(`
        *
        ${include_department === 'true' ? `,department:departments(*)` : ''}
        ${include_coordinator === 'true' ? `,class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)` : ''}
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,batch_code.ilike.%${search}%,section.ilike.%${search}%`);
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    if (year) {
      query = query.eq('year', Number(year));
    }

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (section) {
      query = query.eq('section', section);
    }

    if (intake_year) {
      query = query.eq('intake_year', Number(intake_year));
    }

    // Apply sorting
    const sortFields = sort_by.toString().split(',');
    sortFields.forEach(field => {
      query = query.order(field.trim(), { ascending: sort_order === 'asc' });
    });

    // Apply pagination
    const from = ((Number(page) - 1) * Number(limit));
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching student batches:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch student batches',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: PaginatedResponse<StudentBatch> = {
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
    console.error('Error in getAllBatches:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/batches/:id
 * Retrieve a specific student batch by ID with optional related data
 */
export const getBatchById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_department, include_coordinator, include_subjects, include_schedule } = req.query;

    let selectQuery = `
      *
      ${include_department === 'true' ? `,department:departments(*)` : ''}
      ${include_coordinator === 'true' ? `,class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)` : ''}
      ${include_subjects === 'true' ? `,
        batch_subject_assignments(
          *,
          subject:subjects(*)
        )
      ` : ''}
    `;

    const { data, error } = await supabase
      .from('student_batches')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Student batch not found',
          status: 404
        } as ApiError);
      }
      
      console.error('Error fetching student batch:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch student batch',
        status: 500,
        details: error
      } as ApiError);
    }

    // Include schedule if requested
    if (include_schedule === 'true') {
      const { data: schedule } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          time_slot:time_slots(*),
          subject:subjects(*),
          faculty:faculty(*),
          classroom:classrooms(*)
        `)
        .eq('batch_id', id)
        .order('time_slot.day_of_week')
        .order('time_slot.start_time');

      data.schedule = schedule || [];
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: 'Student batch retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getBatchById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/batches
 * Create a new student batch with validation
 */
export const createBatch: RequestHandler = async (req, res) => {
  try {
    const batchData: CreateStudentBatchRequest = req.body;

    // Validation
    if (!batchData.name || !batchData.batch_code || !batchData.department_id || 
        !batchData.year || !batchData.semester || !batchData.strength || 
        !batchData.academic_year || !batchData.intake_year) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, batch code, department ID, year, semester, strength, academic year, and intake year are required',
        status: 400
      } as ApiError);
    }

    // Check for duplicate batch code
    const { data: existingBatch, error: checkError } = await supabase
      .from('student_batches')
      .select('id')
      .eq('batch_code', batchData.batch_code)
      .single();

    if (existingBatch) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Batch code already exists',
        status: 409
      } as ApiError);
    }

    // Validate department exists
    const { data: deptExists, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('id', batchData.department_id)
      .eq('is_active', true)
      .single();

    if (!deptExists) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid Department ID',
        status: 400
      } as ApiError);
    }

    // Validate class coordinator if provided
    if (batchData.class_coordinator_id) {
      const { data: coordinatorExists, error: coordError } = await supabase
        .from('faculty')
        .select('id')
        .eq('id', batchData.class_coordinator_id)
        .eq('is_active', true)
        .single();

      if (!coordinatorExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Class Coordinator ID',
          status: 400
        } as ApiError);
      }
    }

    // Validate year and semester ranges
    if (batchData.year < 1 || batchData.year > 4) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Year must be between 1 and 4',
        status: 400
      } as ApiError);
    }

    if (batchData.semester < 1 || batchData.semester > 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Semester must be between 1 and 8',
        status: 400
      } as ApiError);
    }

    // Validate strength
    if (batchData.strength <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Batch strength must be greater than 0',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('student_batches')
      .insert([{
        ...batchData,
        section: batchData.section || 'A',
        is_active: true
      }])
      .select(`
        *,
        department:departments(*),
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error creating student batch:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create student batch',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: 'Student batch created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createBatch:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * PUT /api/batches/:id
 * Update an existing student batch
 */
export const updateBatch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateStudentBatchRequest = req.body;

    // Check if batch exists
    const { data: existingBatch, error: checkError } = await supabase
      .from('student_batches')
      .select('id, batch_code')
      .eq('id', id)
      .single();

    if (!existingBatch) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student batch not found',
        status: 404
      } as ApiError);
    }

    // Check for duplicate batch code if being updated
    if (updateData.batch_code && updateData.batch_code !== existingBatch.batch_code) {
      const { data: duplicateCheck } = await supabase
        .from('student_batches')
        .select('id')
        .eq('batch_code', updateData.batch_code)
        .neq('id', id)
        .single();

      if (duplicateCheck) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Batch code already exists',
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

    // Validate class coordinator if being updated
    if (updateData.class_coordinator_id) {
      const { data: coordinatorExists } = await supabase
        .from('faculty')
        .select('id')
        .eq('id', updateData.class_coordinator_id)
        .eq('is_active', true)
        .single();

      if (!coordinatorExists) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Class Coordinator ID',
          status: 400
        } as ApiError);
      }
    }

    // Validate ranges if being updated
    if (updateData.year !== undefined && (updateData.year < 1 || updateData.year > 4)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Year must be between 1 and 4',
        status: 400
      } as ApiError);
    }

    if (updateData.semester !== undefined && (updateData.semester < 1 || updateData.semester > 8)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Semester must be between 1 and 8',
        status: 400
      } as ApiError);
    }

    if (updateData.strength !== undefined && updateData.strength <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Batch strength must be greater than 0',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('student_batches')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error updating student batch:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update student batch',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: 'Student batch updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateBatch:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * DELETE /api/batches/:id
 * Soft delete a student batch (set is_active to false)
 */
export const deleteBatch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    // Check if batch exists
    const { data: existingBatch, error: checkError } = await supabase
      .from('student_batches')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existingBatch) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student batch not found',
        status: 404
      } as ApiError);
    }

    // Check for dependencies
    const { count: scheduledClasses } = await supabase
      .from('scheduled_classes')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id);

    if (hard_delete === 'true') {
      // Hard delete - only if no dependencies
      if (scheduledClasses && scheduledClasses > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete batch with scheduled classes',
          status: 409,
          details: {
            scheduled_classes: scheduledClasses
          }
        } as ApiError);
      }

      const { error } = await supabase
        .from('student_batches')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting student batch:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to delete student batch',
          status: 500,
          details: error
        } as ApiError);
      }
    } else {
      // Soft delete
      const { data, error } = await supabase
        .from('student_batches')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating student batch:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to deactivate student batch',
          status: 500,
          details: error
        } as ApiError);
      }
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: hard_delete === 'true' ? 'Student batch deleted successfully' : 'Student batch deactivated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteBatch:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * ============================================================================
 * SPECIALIZED BATCH ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/batches/:id/assign-coordinator
 * Assign or change class coordinator for a batch
 */
export const assignCoordinator: RequestHandler = async (req, res) => {
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

    // Get batch info to validate department match
    const { data: batch } = await supabase
      .from('student_batches')
      .select('department_id')
      .eq('id', id)
      .single();

    if (faculty.department_id && batch && faculty.department_id !== batch.department_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Faculty member should belong to the same department as the batch',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('student_batches')
      .update({
        class_coordinator_id: faculty_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error assigning coordinator:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to assign class coordinator',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: `${faculty.name} assigned as class coordinator successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in assignCoordinator:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * GET /api/batches/:id/subjects
 * Get all subjects assigned to a batch
 */
export const getBatchSubjects: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, semester } = req.query;

    let query = supabase
      .from('batch_subject_assignments')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('batch_id', id);

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    if (semester) {
      query = query.eq('semester', Number(semester));
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching batch subjects:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch batch subjects',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<BatchSubjectAssignment[]> = {
      data: data || [],
      success: true,
      message: 'Batch subjects retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getBatchSubjects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/batches/:id/subjects
 * Assign a subject to a batch
 */
export const assignSubjectToBatch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentData: CreateBatchSubjectAssignmentRequest = {
      ...req.body,
      batch_id: Number(id)
    };

    // Validate batch exists
    const { data: batch, error: batchError } = await supabase
      .from('student_batches')
      .select('id, name, department_id, year, semester')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (!batch) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student batch not found or inactive',
        status: 404
      } as ApiError);
    }

    // Validate subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, department_id, year, semester')
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
      .from('batch_subject_assignments')
      .select('id')
      .eq('batch_id', id)
      .eq('subject_id', assignmentData.subject_id)
      .eq('academic_year', assignmentData.academic_year || new Date().getFullYear().toString())
      .single();

    if (existingAssignment) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Subject is already assigned to this batch for the academic year',
        status: 409
      } as ApiError);
    }

    // Validate department match if subject has specific department
    if (subject.department_id && subject.department_id !== batch.department_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Subject does not belong to the batch department',
        status: 400
      } as ApiError);
    }

    const { data, error } = await supabase
      .from('batch_subject_assignments')
      .insert([{
        ...assignmentData,
        is_elective: assignmentData.is_elective || false,
        academic_year: assignmentData.academic_year || new Date().getFullYear().toString(),
        semester: assignmentData.semester || batch.semester
      }])
      .select(`
        *,
        subject:subjects(*),
        batch:student_batches(*)
      `)
      .single();

    if (error) {
      console.error('Error creating batch subject assignment:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to assign subject to batch',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<BatchSubjectAssignment> = {
      data,
      success: true,
      message: 'Subject assigned to batch successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in assignSubjectToBatch:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};

/**
 * POST /api/batches/:id/promote
 * Promote batch to next semester/year
 */
export const promoteBatch: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_academic_year } = req.body;

    // Get current batch info
    const { data: batch, error: batchError } = await supabase
      .from('student_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (!batch) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student batch not found',
        status: 404
      } as ApiError);
    }

    // Calculate new semester and year
    let newSemester = batch.semester + 1;
    let newYear = batch.year;

    if (newSemester > 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Batch is already in final semester and cannot be promoted further',
        status: 400
      } as ApiError);
    }

    // Update year if moving to odd semester
    if (newSemester % 2 === 1 && newSemester > 1) {
      newYear = Math.ceil(newSemester / 2);
    }

    const { data, error } = await supabase
      .from('student_batches')
      .update({
        semester: newSemester,
        year: newYear,
        academic_year: new_academic_year || batch.academic_year,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error promoting batch:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to promote batch',
        status: 500,
        details: error
      } as ApiError);
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: `Batch promoted to Year ${newYear}, Semester ${newSemester} successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in promoteBatch:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      status: 500
    } as ApiError);
  }
};