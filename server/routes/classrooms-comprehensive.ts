import { RequestHandler } from "express";
import { ApiResponse, ApiError, PaginatedResponse } from "@shared/enhanced-api";
import { createEnhancedApiError, createPaginatedResponse } from "@shared/error-utils";
import { 
  Classroom, 
  CreateClassroomRequest, 
  UpdateClassroomRequest,
  QueryOptions,
  ClassroomType
} from "@shared/database-types";
import { getSupabaseAdminClient } from "@shared/supabase";

const supabase = getSupabaseAdminClient() as any;

/**
 * ============================================================================
 * CLASSROOM CRUD OPERATIONS
 * Complete classroom management with capacity, equipment tracking, and availability
 * ============================================================================
 */

/**
 * GET /api/classrooms
 * Retrieve all classrooms with filtering, sorting, and pagination
 */
export const getAllClassrooms: RequestHandler = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      building,
      type,
      capacity_min,
      capacity_max,
      has_projector,
      has_smartboard,
      has_ac,
      has_computer_lab,
      is_available,
      floor_number,
      sort_by = 'building,room_number',
      sort_order = 'asc'
    } = req.query;

    let query = supabase
      .from('classrooms')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`room_number.ilike.%${search}%,building.ilike.%${search}%,equipment.ilike.%${search}%`);
    }

    if (building) {
      query = query.eq('building', building);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (capacity_min) {
      query = query.gte('capacity', Number(capacity_min));
    }

    if (capacity_max) {
      query = query.lte('capacity', Number(capacity_max));
    }

    if (has_projector !== undefined) {
      query = query.eq('has_projector', has_projector === 'true');
    }

    if (has_smartboard !== undefined) {
      query = query.eq('has_smartboard', has_smartboard === 'true');
    }

    if (has_ac !== undefined) {
      query = query.eq('has_ac', has_ac === 'true');
    }

    if (has_computer_lab !== undefined) {
      query = query.eq('has_computer_lab', has_computer_lab === 'true');
    }

    if (is_available !== undefined) {
      query = query.eq('is_available', is_available === 'true');
    }

    if (floor_number) {
      query = query.eq('floor_number', Number(floor_number));
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
      console.error('Error fetching classrooms:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch classrooms', error)
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
    console.error('Error in getAllClassrooms:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * GET /api/classrooms/:id
 * Retrieve a specific classroom by ID with optional usage statistics
 */
export const getClassroomById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_usage, academic_year, semester } = req.query;

    let selectQuery = '*';
    
    if (include_usage === 'true') {
      selectQuery += `,
        current_classes:scheduled_classes(count),
        weekly_hours:scheduled_classes(
          time_slot:time_slots(duration_minutes)
        )
      `;
    }

    const { data, error } = await supabase
      .from('classrooms')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(
          createEnhancedApiError('NOT_FOUND', 'Classroom not found')
        );
      }
      
      console.error('Error fetching classroom:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch classroom', error)
      );
    }

    // Calculate usage statistics if requested
    if (include_usage === 'true') {
      let usageQuery = supabase
        .from('scheduled_classes')
        .select(`
          *,
          time_slot:time_slots(*),
          timetable:timetables(*)
        `)
        .eq('classroom_id', id);

      if (academic_year || semester) {
        usageQuery = usageQuery.eq('timetable.academic_year', academic_year);
        if (semester) {
          usageQuery = usageQuery.eq('timetable.semester', Number(semester));
        }
      }

      const { data: usageData } = await usageQuery;
      
      const totalHours = usageData?.reduce((sum, cls) => {
        return sum + ((cls.time_slot?.duration_minutes || 0) / 60);
      }, 0) || 0;

      data.usage_statistics = {
        total_classes: usageData?.length || 0,
        total_weekly_hours: totalHours,
        utilization_percentage: Math.round((totalHours / (8 * 6)) * 100), // Assuming 8 hours/day, 6 days/week
        recent_classes: usageData?.slice(0, 5) || []
      };
    }

    const response: ApiResponse<Classroom> = {
      data,
      success: true,
      message: 'Classroom retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getClassroomById:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * POST /api/classrooms
 * Create a new classroom with validation
 */
export const createClassroom: RequestHandler = async (req, res) => {
  try {
    const classroomData: CreateClassroomRequest = req.body;

    // Validation
    if (!classroomData.room_number || !classroomData.building || !classroomData.capacity) {
      return res.status(400).json(
        createEnhancedApiError('VALIDATION_ERROR', 'Room number, building, and capacity are required')
      );
    }

    // Check for duplicate room number in the same building
    const { data: existingRoom, error: checkError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('room_number', classroomData.room_number)
      .eq('building', classroomData.building)
      .single();

    if (existingRoom) {
      return res.status(409).json(
        createEnhancedApiError('CONFLICT', 'Room number already exists in this building')
      );
    }

    // Validate capacity
    if (classroomData.capacity <= 0) {
      return res.status(400).json(createEnhancedApiError('VALIDATION_ERROR', 'Capacity must be greater than 0'));
    }

    // Validate floor number if provided
    if (classroomData.floor_number !== undefined && classroomData.floor_number < 0) {
      return res.status(400).json(createEnhancedApiError('VALIDATION_ERROR', 'Floor number cannot be negative'));
    }

    const { data, error } = await supabase
      .from('classrooms')
      .insert([{
        ...classroomData,
        type: classroomData.type || 'Lecture',
        has_projector: classroomData.has_projector || false,
        has_smartboard: classroomData.has_smartboard || false,
        has_ac: classroomData.has_ac || false,
        has_computer_lab: classroomData.has_computer_lab || false,
        is_available: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating classroom:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to create classroom', error)
      );
    }

    const response: ApiResponse<Classroom> = {
      data,
      success: true,
      message: 'Classroom created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createClassroom:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * PUT /api/classrooms/:id
 * Update an existing classroom
 */
export const updateClassroom: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateClassroomRequest = req.body;

    // Check if classroom exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('classrooms')
      .select('id, room_number, building')
      .eq('id', id)
      .single();

    if (!existingRoom) {
      return res.status(404).json(createEnhancedApiError('NOT_FOUND', 'Classroom not found'));
    }

    // Check for duplicate room number if being updated
    if ((updateData.room_number && updateData.room_number !== existingRoom.room_number) ||
        (updateData.building && updateData.building !== existingRoom.building)) {
      const roomNumber = updateData.room_number || existingRoom.room_number;
      const building = updateData.building || existingRoom.building;

      const { data: duplicateCheck } = await supabase
        .from('classrooms')
        .select('id')
        .eq('room_number', roomNumber)
        .eq('building', building)
        .neq('id', id)
        .single();

      if (duplicateCheck) {
        return res.status(409).json(
          createEnhancedApiError('CONFLICT', 'Room number already exists in this building')
        );
      }
    }

    // Validate capacity if being updated
    if (updateData.capacity !== undefined && updateData.capacity <= 0) {
      return res.status(400).json(createEnhancedApiError('VALIDATION_ERROR', 'Capacity must be greater than 0'));
    }

    // Validate floor number if being updated
    if (updateData.floor_number !== undefined && updateData.floor_number < 0) {
      return res.status(400).json(createEnhancedApiError('VALIDATION_ERROR', 'Floor number cannot be negative'));
    }

    const { data, error } = await supabase
      .from('classrooms')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating classroom:', error);
      return res.status(500).json(
        createEnhancedApiError('DATABASE_ERROR', 'Failed to update classroom', error)
      );
    }

    const response: ApiResponse<Classroom> = {
      data,
      success: true,
      message: 'Classroom updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateClassroom:', error);
    res.status(500).json(
      createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
    );
  }
};

/**
 * DELETE /api/classrooms/:id
 * Delete a classroom (only if no active scheduled classes)
 */
export const deleteClassroom: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    // Check if classroom exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('classrooms')
      .select('id, room_number, building')
      .eq('id', id)
      .single();

    if (!existingRoom) {
      return res.status(404).json(
        createEnhancedApiError('NOT_FOUND', 'Classroom not found')
      );
    }

    // Check for active scheduled classes
    const { data: activeClasses, count } = await supabase
      .from('scheduled_classes')
      .select('id', { count: 'exact' })
      .eq('classroom_id', id);

    if (count && count > 0 && force !== 'true') {
      return res.status(409).json(createEnhancedApiError('CONFLICT', 'Cannot delete classroom with active scheduled classes', {
        active_classes: count,
        suggestion: 'Use force=true to delete anyway, or deactivate the classroom instead'
      }));
    }

    if (force === 'true' && count && count > 0) {
      // Delete all scheduled classes first
      await supabase
        .from('scheduled_classes')
        .delete()
        .eq('classroom_id', id);
    }

    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting classroom:', error);
      return res.status(500).json(createEnhancedApiError('DATABASE_ERROR', 'Failed to delete classroom', error));
    }

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Classroom deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in deleteClassroom:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * ============================================================================
 * SPECIALIZED CLASSROOM ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/classrooms/:id/toggle-availability
 * Toggle classroom availability status
 */
export const toggleClassroomAvailability: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: classroom, error: fetchError } = await supabase
      .from('classrooms')
      .select('id, room_number, building, is_available')
      .eq('id', id)
      .single();

    if (!classroom) {
      return res.status(404).json(createEnhancedApiError('NOT_FOUND', 'Classroom not found'));
    }

    const newStatus = !classroom.is_available;

    const { data, error } = await supabase
      .from('classrooms')
      .update({
        is_available: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling classroom availability:', error);
      return res.status(500).json(createEnhancedApiError('DATABASE_ERROR', 'Failed to toggle classroom availability', error));
    }

    const response: ApiResponse<Classroom> = {
      data,
      success: true,
      message: `Classroom ${newStatus ? 'activated' : 'deactivated'} successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in toggleClassroomAvailability:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * GET /api/classrooms/:id/schedule
 * Get classroom schedule for a specific time period
 */
export const getClassroomSchedule: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, semester, week_start } = req.query;

    // Validate classroom exists
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, room_number, building')
      .eq('id', id)
      .single();

    if (!classroom) {
      return res.status(404).json(createEnhancedApiError('NOT_FOUND', 'Classroom not found'));
    }

    let query = supabase
      .from('scheduled_classes')
      .select(`
        *,
        time_slot:time_slots(*),
        subject:subjects(*),
        faculty:faculty(*),
        batch:student_batches(*),
        timetable:timetables(*)
      `)
      .eq('classroom_id', id);

    if (academic_year || semester) {
      if (academic_year) {
        query = query.eq('timetable.academic_year', academic_year);
      }
      if (semester) {
        query = query.eq('timetable.semester', Number(semester));
      }
    }

    query = query.order('time_slot.day_of_week').order('time_slot.start_time');

    const { data: schedule, error } = await query;

    if (error) {
      console.error('Error fetching classroom schedule:', error);
      return res.status(500).json(createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch classroom schedule', error));
    }

    const response: ApiResponse<{
      classroom: typeof classroom;
      schedule: typeof schedule;
      total_classes: number;
    }> = {
      data: {
        classroom,
        schedule: schedule || [],
        total_classes: schedule?.length || 0
      },
      success: true,
      message: 'Classroom schedule retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getClassroomSchedule:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * GET /api/classrooms/available
 * Get available classrooms for a specific time slot
 */
export const getAvailableClassrooms: RequestHandler = async (req, res) => {
  try {
    const { 
      day_of_week, 
      start_time, 
      end_time, 
      capacity_min,
      type,
      has_projector,
      has_smartboard,
      has_computer_lab,
      academic_year,
      semester 
    } = req.query;

    // Start with all available classrooms
    let query = supabase
      .from('classrooms')
      .select('*')
      .eq('is_available', true);

    // Apply filters
    if (capacity_min) {
      query = query.gte('capacity', Number(capacity_min));
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (has_projector === 'true') {
      query = query.eq('has_projector', true);
    }

    if (has_smartboard === 'true') {
      query = query.eq('has_smartboard', true);
    }

    if (has_computer_lab === 'true') {
      query = query.eq('has_computer_lab', true);
    }

    const { data: allClassrooms, error: classroomError } = await query;

    if (classroomError) {
      console.error('Error fetching classrooms:', classroomError);
      return res.status(500).json(createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch classrooms', classroomError));
    }

    // If time constraints are provided, filter out busy classrooms
    let availableClassrooms = allClassrooms || [];

    if (day_of_week && start_time && end_time) {
      // Get time slots that overlap with the requested time
      const { data: overlappingTimeSlots, error: timeSlotError } = await supabase
        .from('time_slots')
        .select('id')
        .eq('day_of_week', day_of_week)
        .or(`start_time.lte.${end_time},end_time.gte.${start_time}`);

      if (overlappingTimeSlots && overlappingTimeSlots.length > 0) {
        const timeSlotIds = overlappingTimeSlots.map(slot => slot.id);

        // Get classrooms that are busy during these time slots
        let busyQuery = supabase
          .from('scheduled_classes')
          .select('classroom_id')
          .in('time_slot_id', timeSlotIds);

        if (academic_year || semester) {
          busyQuery = busyQuery.eq('timetable.academic_year', academic_year);
          if (semester) {
            busyQuery = busyQuery.eq('timetable.semester', Number(semester));
          }
        }

        const { data: busyClassrooms } = await busyQuery;
        const busyClassroomIds = busyClassrooms?.map(bc => bc.classroom_id) || [];

        // Filter out busy classrooms
        availableClassrooms = availableClassrooms.filter(
          classroom => !busyClassroomIds.includes(classroom.id)
        );
      }
    }

    const response: ApiResponse<Classroom[]> = {
      data: availableClassrooms,
      success: true,
      message: `Found ${availableClassrooms.length} available classrooms`
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getAvailableClassrooms:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};

/**
 * GET /api/classrooms/buildings
 * Get list of all buildings with classroom counts
 */
export const getBuildings: RequestHandler = async (req, res) => {
  try {
    const { data: buildings, error } = await supabase
      .from('classrooms')
      .select('building')
      .not('building', 'is', null);

    if (error) {
      console.error('Error fetching buildings:', error);
      return res.status(500).json(createEnhancedApiError('DATABASE_ERROR', 'Failed to fetch buildings', error));
    }

    // Group and count by building
    const buildingCounts: { [key: string]: number } = {};
    buildings?.forEach(item => {
      if (item.building) {
        buildingCounts[item.building] = (buildingCounts[item.building] || 0) + 1;
      }
    });

    const buildingList = Object.entries(buildingCounts).map(([name, count]) => ({
      name,
      classroom_count: count
    }));

    const response: ApiResponse<typeof buildingList> = {
      data: buildingList,
      success: true,
      message: 'Buildings retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getBuildings:', error);
    res.status(500).json(createEnhancedApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', error));
  }
};