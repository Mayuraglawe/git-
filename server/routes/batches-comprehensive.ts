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
import { getSupabaseAdminClient } from "@shared/supabase";
import { createEnhancedApiError, createPaginatedResponse } from "@shared/error-utils";

const supabase = getSupabaseAdminClient() as any;

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
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch student batches', error)
      );
    }

    const response = createPaginatedResponse(
      data || [],
      Number(page),
      Number(limit),
      count || 0
    );

    res.json(response);
  } catch (error) {
    console.error('Error in getAllBatches:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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
        return res.status(404).json(
          createEnhancedApiError('NOT_FOUND', 'Student batch not found')
        );
      }
      
      console.error('Error fetching student batch:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch student batch', error)
      );
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
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Name, batch code, department ID, year, semester, strength, academic year, and intake year are required')
      );
    }

    // Check for duplicate batch code
    const { data: existingBatch, error: checkError } = await supabase
      .from('student_batches')
      .select('id')
      .eq('batch_code', batchData.batch_code)
      .single() as { data: any; error: any };

    if (existingBatch) {
      return res.status(409).json(
        createEnhancedApiError('CONFLICT', 'Batch code already exists')
      );
    }

    // Validate department exists
    const { data: deptExists, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('id', batchData.department_id)
      .eq('is_active', true)
      .single();

    if (!deptExists) {
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Invalid Department ID')
      );
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
        return res.status(400).json(createEnhancedApiError('Validation Error', 'Invalid Class Coordinator ID'));
      }
    }

    // Validate year and semester ranges
    if (batchData.year < 1 || batchData.year > 4) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Year must be between 1 and 4'));
    }

    if (batchData.semester < 1 || batchData.semester > 8) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Semester must be between 1 and 8'));
    }

    // Validate strength
    if (batchData.strength <= 0) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Batch strength must be greater than 0'));
    }

    const { data, error } = await supabase
      .from('student_batches')
      .insert([{
        ...batchData,
        section: batchData.section || 'A',
        is_active: true
      }] as any)
      .select(`
        *,
        department:departments(*),
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error creating student batch:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to create student batch', error)
      );
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: 'Student batch created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createBatch:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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
      .single() as { data: any; error: any };

    if (!existingBatch) {
      return res.status(404).json(createEnhancedApiError('Not Found', 'Student batch not found'));
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
        return res.status(409).json(createEnhancedApiError('Conflict', 'Batch code already exists'));
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
        return res.status(400).json(createEnhancedApiError('Validation Error', 'Invalid Department ID'));
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
        return res.status(400).json(createEnhancedApiError('Validation Error', 'Invalid Class Coordinator ID'));
      }
    }

    // Validate ranges if being updated
    if (updateData.year !== undefined && (updateData.year < 1 || updateData.year > 4)) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Year must be between 1 and 4'));
    }

    if (updateData.semester !== undefined && (updateData.semester < 1 || updateData.semester > 8)) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Semester must be between 1 and 8'));
    }

    if (updateData.strength !== undefined && updateData.strength <= 0) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Batch strength must be greater than 0'));
    }

    // @ts-ignore - Supabase update type inference limitation
    const { data, error } = await supabase
      .from('student_batches')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error updating student batch:', error);
      return res.status(500).json(createEnhancedApiError('Database Error', 'Failed to update student batch', error
      ));
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: 'Student batch updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateBatch:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
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
      return res.status(404).json(createEnhancedApiError('Not Found', 'Student batch not found'));
    }

    // Check for dependencies
    const { count: scheduledClasses } = await supabase
      .from('scheduled_classes')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id);

    if (hard_delete === 'true') {
      // Hard delete - only if no dependencies
      if (scheduledClasses && scheduledClasses > 0) {
        return res.status(409).json(
          createEnhancedApiError('CONFLICT', 'Cannot delete batch with scheduled classes', {
            scheduled_classes: scheduledClasses
          })
        );
      }

      const { error } = await supabase
        .from('student_batches')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting student batch:', error);
        return res.status(500).json(createEnhancedApiError('Database Error', 'Failed to delete student batch', error
        ));
      }
    } else {
      // Soft delete
      // @ts-ignore - Supabase update type inference limitation
      const { data, error } = await supabase
        .from('student_batches')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating student batch:', error);
        return res.status(500).json(createEnhancedApiError('Database Error', 'Failed to deactivate student batch', error
        ));
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
    res.status(500).json(createEnhancedApiError('Internal Server Error', 'An unexpected error occurred'));
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
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Faculty ID is required')
      );
    }

    // Validate faculty exists and is active
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .select('id, name, department_id')
      .eq('id', faculty_id)
      .eq('is_active', true)
      .single();

    if (!faculty) {
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Invalid or inactive faculty member')
      );
    }

    // Get batch info to validate department match
    const { data: batch } = await supabase
      .from('student_batches')
      .select('department_id')
      .eq('id', id)
      .single();

    if (faculty.department_id && batch && faculty.department_id !== batch.department_id) {
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Faculty member should belong to the same department as the batch')
      );
    }

    // @ts-ignore - Supabase update type inference limitation
    const { data, error } = await supabase
      .from('student_batches')
      .update({
        class_coordinator_id: faculty_id,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select(`
        *,
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error assigning coordinator:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to assign class coordinator', error)
      );
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: `${faculty.name} assigned as class coordinator successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in assignCoordinator:', error);
    res.status(500).json(createEnhancedApiError('Internal Server Error', 'An unexpected error occurred'));
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
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch batch subjects', error)
      );
    }

    const response: ApiResponse<BatchSubjectAssignment[]> = {
      data: data || [],
      success: true,
      message: 'Batch subjects retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getBatchSubjects:', error);
    res.status(500).json(createEnhancedApiError('Internal Server Error', 'An unexpected error occurred'));
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
      return res.status(404).json(createEnhancedApiError('Not Found', 'Student batch not found or inactive'));
    }

    // Validate subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, department_id, year, semester')
      .eq('id', assignmentData.subject_id)
      .single();

    if (!subject) {
      return res.status(404).json(createEnhancedApiError('Not Found', 'Subject not found'));
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
      return res.status(409).json(createEnhancedApiError('Conflict', 'Subject is already assigned to this batch for the academic year'));
    }

    // Validate department match if subject has specific department
    if (subject.department_id && subject.department_id !== batch.department_id) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Subject does not belong to the batch department'));
    }

    const { data, error } = await supabase
      .from('batch_subject_assignments')
      .insert([{
        ...assignmentData,
        is_elective: assignmentData.is_elective || false,
        academic_year: assignmentData.academic_year || new Date().getFullYear().toString(),
        semester: assignmentData.semester || batch.semester
      }] as any)
      .select(`
        *,
        subject:subjects(*),
        batch:student_batches(*)
      `)
      .single();

    if (error) {
      console.error('Error creating batch subject assignment:', error);
      return res.status(500).json(createEnhancedApiError('Database Error', 'Failed to assign subject to batch', error
      ));
    }

    const response: ApiResponse<BatchSubjectAssignment> = {
      data,
      success: true,
      message: 'Subject assigned to batch successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in assignSubjectToBatch:', error);
    res.status(500).json(createEnhancedApiError('Internal Server Error', 'An unexpected error occurred'));
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
      .single() as { data: any; error: any };

    if (!batch) {
      return res.status(404).json(createEnhancedApiError('Not Found', 'Student batch not found'));
    }

    // Calculate new semester and year
    let newSemester = batch.semester + 1;
    let newYear = batch.year;

    if (newSemester > 8) {
      return res.status(400).json(createEnhancedApiError('Validation Error', 'Batch is already in final semester and cannot be promoted further'));
    }

    // Update year if moving to odd semester
    if (newSemester % 2 === 1 && newSemester > 1) {
      newYear = Math.ceil(newSemester / 2);
    }

    // @ts-ignore - Supabase update type inference limitation
    const { data, error } = await supabase
      .from('student_batches')
      .update({
        semester: newSemester,
        year: newYear,
        academic_year: new_academic_year || batch.academic_year,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        class_coordinator:faculty!student_batches_class_coordinator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error promoting batch:', error);
      return res.status(500).json(createEnhancedApiError('Database Error', 'Failed to promote batch', error
      ));
    }

    const response: ApiResponse<StudentBatch> = {
      data,
      success: true,
      message: `Batch promoted to Year ${newYear}, Semester ${newSemester} successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in promoteBatch:', error);
    res.status(500).json(createEnhancedApiError('Internal Server Error', 'An unexpected error occurred'));
  }
};

