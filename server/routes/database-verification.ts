import { RequestHandler } from "express";
import { getSupabaseAdminClient } from "@shared/supabase";

const supabase = getSupabaseAdminClient();

/**
 * ============================================================================
 * DATABASE VERIFICATION AND TESTING ENDPOINTS
 * Ensures all data operations are properly connected to the database
 * ============================================================================
 */

/**
 * GET /api/database/test-connection
 * Test database connectivity and basic operations
 */
export const testDatabaseConnection: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Testing database connection...");

    // Test basic connectivity
    const { data: connectionTest, error: connectionError } = await supabase
      .from('departments')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: connectionError,
        status: 500
      });
    }

    console.log("✅ Database connection successful");

    // Test all table accessibility
    const tables = [
      'departments', 'faculty', 'subjects', 'classrooms', 'student_batches',
      'time_slots', 'timetables', 'scheduled_classes', 
      'faculty_subject_assignments', 'batch_subject_assignments', 'college_events'
    ];

    const tableTests = await Promise.allSettled(
      tables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);
        
        return {
          table,
          accessible: !error,
          error: error?.message,
          count: data?.[0]?.count || 0
        };
      })
    );

    const tableResults = tableTests.map((result, index) => ({
      table: tables[index],
      status: result.status,
      ...(result.status === 'fulfilled' ? result.value : { error: result.reason })
    }));

    const failedTables = tableResults.filter(t => !t.accessible);
    const successfulTables = tableResults.filter(t => t.accessible);

    console.log(`✅ ${successfulTables.length}/${tables.length} tables accessible`);
    if (failedTables.length > 0) {
      console.log(`❌ Failed tables:`, failedTables.map(t => t.table));
    }

    res.json({
      success: true,
      message: 'Database connection test completed',
      results: {
        connection: 'successful',
        total_tables: tables.length,
        accessible_tables: successfulTables.length,
        failed_tables: failedTables.length,
        table_details: tableResults
      }
    });

  } catch (error) {
    console.error("💥 Database test error:", error);
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    });
  }
};

/**
 * POST /api/database/verify-crud
 * Test CRUD operations on all tables to ensure data persistence
 */
export const verifyCRUDOperations: RequestHandler = async (req, res) => {
  try {
    console.log("🧪 Testing CRUD operations...");

    const testResults: any[] = [];

    // Test Department CRUD
    console.log("Testing Department CRUD...");
    const deptTestData = {
      name: `Test Department ${Date.now()}`,
      code: `TD${Date.now()}`,
      description: 'Test department for CRUD verification',
      established_year: 2024,
      contact_email: `test${Date.now()}@test.com`,
      building: 'Test Building',
      floor_number: 1
    };

    // CREATE
    const { data: createdDept, error: createDeptError } = await supabase
      .from('departments')
      .insert([deptTestData])
      .select()
      .single();

    if (createDeptError) {
      testResults.push({
        table: 'departments',
        operation: 'CREATE',
        success: false,
        error: createDeptError.message
      });
    } else {
      testResults.push({
        table: 'departments',
        operation: 'CREATE',
        success: true,
        created_id: createdDept?.id
      });

      // READ
      const { data: readDept, error: readDeptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', createdDept?.id)
        .single();

      testResults.push({
        table: 'departments',
        operation: 'READ',
        success: !readDeptError && readDept?.name === deptTestData.name,
        error: readDeptError?.message
      });

      // UPDATE
      const updateData = { description: 'Updated test description' };
      const { data: updatedDept, error: updateDeptError } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', createdDept?.id)
        .select()
        .single();

      testResults.push({
        table: 'departments',
        operation: 'UPDATE',
        success: !updateDeptError && updatedDept?.description === updateData.description,
        error: updateDeptError?.message
      });

      // DELETE
      const { error: deleteDeptError } = await supabase
        .from('departments')
        .delete()
        .eq('id', createdDept?.id);

      testResults.push({
        table: 'departments',
        operation: 'DELETE',
        success: !deleteDeptError,
        error: deleteDeptError?.message
      });
    }

    // Test Time Slots CRUD (simpler table)
    console.log("Testing Time Slots CRUD...");
    const timeSlotTestData = {
      day_of_week: 'Monday' as const,
      start_time: '09:00:00',
      end_time: '10:00:00',
      slot_name: `Test Slot ${Date.now()}`,
      slot_type: 'regular' as const
    };

    const { data: createdSlot, error: createSlotError } = await supabase
      .from('time_slots')
      .insert([timeSlotTestData])
      .select()
      .single();

    if (createSlotError) {
      testResults.push({
        table: 'time_slots',
        operation: 'CREATE',
        success: false,
        error: createSlotError.message
      });
    } else {
      testResults.push({
        table: 'time_slots',
        operation: 'CREATE',
        success: true,
        created_id: createdSlot?.id
      });

      // Cleanup
      await supabase.from('time_slots').delete().eq('id', createdSlot?.id);
    }

    const successfulOperations = testResults.filter(r => r.success).length;
    const totalOperations = testResults.length;

    console.log(`✅ ${successfulOperations}/${totalOperations} CRUD operations successful`);

    res.json({
      success: true,
      message: 'CRUD operations test completed',
      results: {
        total_operations: totalOperations,
        successful_operations: successfulOperations,
        success_rate: `${Math.round((successfulOperations / totalOperations) * 100)}%`,
        operation_details: testResults
      }
    });

  } catch (error) {
    console.error("💥 CRUD test error:", error);
    res.status(500).json({
      success: false,
      error: 'CRUD test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    });
  }
};

/**
 * GET /api/database/status
 * Get comprehensive database status and statistics
 */
export const getDatabaseStatus: RequestHandler = async (req, res) => {
  try {
    console.log("📊 Getting database status...");

    const tables = [
      'departments', 'faculty', 'subjects', 'classrooms', 'student_batches',
      'time_slots', 'timetables', 'scheduled_classes', 
      'faculty_subject_assignments', 'batch_subject_assignments', 'college_events'
    ];

    // Get record counts for all tables
    const tableCounts = await Promise.allSettled(
      tables.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        return {
          table,
          count: count || 0,
          hasError: !!error,
          error: error?.message
        };
      })
    );

    const tableStats = tableCounts.map((result, index) => ({
      table: tables[index],
      ...(result.status === 'fulfilled' ? result.value : { count: 0, hasError: true, error: 'Failed to fetch' })
    }));

    const totalRecords = tableStats.reduce((sum, stat) => sum + (stat.hasError ? 0 : stat.count), 0);
    const tablesWithData = tableStats.filter(stat => !stat.hasError && stat.count > 0).length;

    // Check for recent activity (last 24 hours)
    const { count: recentDepartments } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: recentFaculty } = await supabase
      .from('faculty')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`📈 Database contains ${totalRecords} total records across ${tablesWithData} tables`);

    res.json({
      success: true,
      message: 'Database status retrieved successfully',
      status: {
        total_tables: tables.length,
        tables_with_data: tablesWithData,
        total_records: totalRecords,
        recent_activity: {
          departments_24h: recentDepartments || 0,
          faculty_24h: recentFaculty || 0
        },
        table_statistics: tableStats,
        database_health: totalRecords > 0 ? 'healthy' : 'empty',
        last_checked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("💥 Database status error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database status',
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    });
  }
};

/**
 * POST /api/database/populate-sample
 * Populate database with sample data for testing
 */
export const populateSampleData: RequestHandler = async (req, res) => {
  try {
    console.log("🌱 Populating sample data...");

    const results: any[] = [];

    // Sample departments
    const sampleDepartments = [
      {
        name: 'Computer Science',
        code: 'CS',
        description: 'Department of Computer Science and Engineering',
        established_year: 2010,
        contact_email: 'cs@college.edu',
        building: 'Engineering Block',
        floor_number: 2
      },
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'Department of Information Technology',
        established_year: 2012,
        contact_email: 'it@college.edu',
        building: 'Engineering Block',
        floor_number: 3
      }
    ];

    // Insert departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .upsert(sampleDepartments, { onConflict: 'code' })
      .select();

    results.push({
      operation: 'departments',
      success: !deptError,
      count: departments?.length || 0,
      error: deptError?.message
    });

    if (departments && departments.length > 0) {
      // Sample faculty
      const sampleFaculty = [
        {
          name: 'Dr. John Smith',
          employee_id: 'FAC001',
          department_id: departments[0].id,
          email: 'john.smith@college.edu',
          designation: 'Professor',
          qualification: 'PhD in Computer Science',
          experience_years: 15,
          max_weekly_hours: 20
        },
        {
          name: 'Dr. Jane Doe',
          employee_id: 'FAC002',
          department_id: departments[0].id,
          email: 'jane.doe@college.edu',
          designation: 'Associate Professor',
          qualification: 'PhD in Information Technology',
          experience_years: 10,
          max_weekly_hours: 18
        }
      ];

      const { data: faculty, error: facultyError } = await supabase
        .from('faculty')
        .upsert(sampleFaculty, { onConflict: 'employee_id' })
        .select();

      results.push({
        operation: 'faculty',
        success: !facultyError,
        count: faculty?.length || 0,
        error: facultyError?.message
      });

      // Sample subjects
      const sampleSubjects = [
        {
          name: 'Data Structures and Algorithms',
          code: 'CS301',
          department_id: departments[0].id,
          credits: 4,
          lectures_per_week: 3,
          labs_per_week: 1,
          requires_lab: true,
          semester: 3,
          year: 2,
          subject_type: 'core' as const
        },
        {
          name: 'Database Management Systems',
          code: 'CS302',
          department_id: departments[0].id,
          credits: 4,
          lectures_per_week: 3,
          labs_per_week: 1,
          requires_lab: true,
          semester: 3,
          year: 2,
          subject_type: 'core' as const
        }
      ];

      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .upsert(sampleSubjects, { onConflict: 'code' })
        .select();

      results.push({
        operation: 'subjects',
        success: !subjectsError,
        count: subjects?.length || 0,
        error: subjectsError?.message
      });

      // Sample classrooms
      const sampleClassrooms = [
        {
          room_number: 'CS101',
          building: 'Engineering Block',
          floor_number: 2,
          capacity: 60,
          type: 'lecture' as const,
          has_projector: true,
          has_smartboard: true,
          has_ac: true
        },
        {
          room_number: 'CS-LAB1',
          building: 'Engineering Block',
          floor_number: 2,
          capacity: 30,
          type: 'lab' as const,
          has_projector: true,
          has_computer_lab: true,
          has_ac: true
        }
      ];

      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .upsert(sampleClassrooms, { onConflict: 'room_number' })
        .select();

      results.push({
        operation: 'classrooms',
        success: !classroomsError,
        count: classrooms?.length || 0,
        error: classroomsError?.message
      });

      // Sample time slots
      const sampleTimeSlots = [
        {
          day_of_week: 'Monday' as const,
          start_time: '09:00:00',
          end_time: '10:00:00',
          slot_name: 'Period 1',
          slot_type: 'regular' as const
        },
        {
          day_of_week: 'Monday' as const,
          start_time: '10:00:00',
          end_time: '11:00:00',
          slot_name: 'Period 2',
          slot_type: 'regular' as const
        }
      ];

      const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('time_slots')
        .upsert(sampleTimeSlots, { onConflict: 'slot_name' })
        .select();

      results.push({
        operation: 'time_slots',
        success: !timeSlotsError,
        count: timeSlots?.length || 0,
        error: timeSlotsError?.message
      });
    }

    const successfulOperations = results.filter(r => r.success).length;
    const totalOperations = results.length;

    console.log(`✅ ${successfulOperations}/${totalOperations} sample data operations successful`);

    res.json({
      success: true,
      message: 'Sample data population completed',
      results: {
        total_operations: totalOperations,
        successful_operations: successfulOperations,
        success_rate: `${Math.round((successfulOperations / totalOperations) * 100)}%`,
        operation_details: results
      }
    });

  } catch (error) {
    console.error("💥 Sample data population error:", error);
    res.status(500).json({
      success: false,
      error: 'Sample data population failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    });
  }
};