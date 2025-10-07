#!/usr/bin/env node

/**
 * ============================================================================
 * DATABASE SETUP AND VERIFICATION SCRIPT
 * Ensures all data is properly stored in and retrieved from the database
 * ============================================================================
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from the parent directory
config({ path: resolve(__dirname, "../.env") });

import { getSupabaseAdminClient } from "../shared/supabase";

const supabase = getSupabaseAdminClient();

interface SetupResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

class DatabaseSetup {
  private results: SetupResult[] = [];

  private logStep(step: string, success: boolean, message: string, details?: any) {
    const emoji = success ? "✅" : "❌";
    console.log(`${emoji} ${step}: ${message}`);
    this.results.push({ step, success, message, details });
  }

  /**
   * Test basic database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('count(*)')
        .limit(1);

      if (error) {
        this.logStep('Database Connection', false, `Connection failed: ${error.message}`, error);
        return false;
      }

      this.logStep('Database Connection', true, 'Successfully connected to Supabase');
      return true;
    } catch (error) {
      this.logStep('Database Connection', false, `Connection error: ${error}`, error);
      return false;
    }
  }

  /**
   * Verify all tables exist and are accessible
   */
  async verifyTables(): Promise<boolean> {
    const tables = [
      'departments', 'faculty', 'subjects', 'classrooms', 'student_batches',
      'time_slots', 'timetables', 'scheduled_classes', 
      'faculty_subject_assignments', 'batch_subject_assignments', 'college_events',
      'exam_information', 'assignment_information'
    ];

    let allTablesValid = true;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);

        if (error) {
          this.logStep(`Table: ${table}`, false, `Table not accessible: ${error.message}`);
          allTablesValid = false;
        } else {
          this.logStep(`Table: ${table}`, true, `Table accessible`);
        }
      } catch (error) {
        this.logStep(`Table: ${table}`, false, `Table verification failed: ${error}`);
        allTablesValid = false;
      }
    }

    return allTablesValid;
  }

  /**
   * Test CRUD operations to ensure data persistence
   */
  async testCRUDOperations(): Promise<boolean> {
    let allCRUDPassed = true;

    // Test Department CRUD
    const testDepartment = {
      name: `Setup Test Department ${Date.now()}`,
      code: `STD${Date.now()}`,
      description: 'Test department for setup verification',
      established_year: 2024,
      contact_email: `setup${Date.now()}@test.com`,
      building: 'Test Building',
      floor_number: 1
    };

    try {
      // CREATE
      const { data: created, error: createError } = await supabase
        .from('departments')
        .insert([testDepartment] as any)
        .select()
        .single() as any;

      if (createError || !created) {
        this.logStep('CRUD: CREATE', false, `Create failed: ${createError?.message || 'No data returned'}`);
        allCRUDPassed = false;
      } else {
        this.logStep('CRUD: CREATE', true, 'Data successfully inserted');

        // READ
        const { data: read, error: readError } = await supabase
          .from('departments')
          .select('*')
          .eq('id', created.id)
          .single();

        if (readError || !read) {
          this.logStep('CRUD: READ', false, `Read failed: ${readError?.message || 'No data returned'}`);
          allCRUDPassed = false;
        } else {
          this.logStep('CRUD: READ', true, 'Data successfully retrieved');

          // UPDATE
          const updateData = { description: 'Updated description for setup test' };
          const updateResult: any = await (supabase
            .from('departments')
            // @ts-ignore - Supabase type inference issue
            .update(updateData)
            .eq('id', created.id)
            .select()
            .single());
          
          const { data: updated, error: updateError } = updateResult;

          if (updateError || !updated || (updated as any).description !== updateData.description) {
            this.logStep('CRUD: UPDATE', false, `Update failed: ${updateError?.message || 'Data not updated'}`);
            allCRUDPassed = false;
          } else {
            this.logStep('CRUD: UPDATE', true, 'Data successfully updated');
          }

          // DELETE
          const { error: deleteError } = await supabase
            .from('departments')
            .delete()
            .eq('id', created.id);

          if (deleteError) {
            this.logStep('CRUD: DELETE', false, `Delete failed: ${deleteError.message}`);
            allCRUDPassed = false;
          } else {
            this.logStep('CRUD: DELETE', true, 'Data successfully deleted');
          }
        }
      }
    } catch (error) {
      this.logStep('CRUD: Operations', false, `CRUD test failed: ${error}`);
      allCRUDPassed = false;
    }

    return allCRUDPassed;
  }

  /**
   * Setup sample data for testing
   */
  async setupSampleData(): Promise<boolean> {
    try {
      // Sample departments
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .upsert([
          {
            name: 'Computer Science',
            code: 'CS',
            description: 'Department of Computer Science',
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
        ] as any, { onConflict: 'code' })
        .select();

      if (deptError) {
        this.logStep('Sample Data: Departments', false, `Failed to create departments: ${deptError.message}`);
        return false;
      }

      this.logStep('Sample Data: Departments', true, `Created ${departments?.length || 0} departments`);

      if (departments && departments.length > 0) {
        // Sample faculty
        const { data: faculty, error: facultyError } = await supabase
          .from('faculty')
          .upsert([
            {
              name: 'Dr. John Smith',
              employee_id: 'FAC001',
              department_id: (departments as any)[0].id,
              email: 'john.smith@college.edu',
              designation: 'Professor',
              qualification: 'PhD in Computer Science',
              experience_years: 15,
              max_weekly_hours: 20
            },
            {
              name: 'Dr. Jane Doe',
              employee_id: 'FAC002',
              department_id: (departments as any)[1].id,
              email: 'jane.doe@college.edu',
              designation: 'Associate Professor',
              qualification: 'PhD in Information Technology',
              experience_years: 10,
              max_weekly_hours: 18
            }
          ] as any, { onConflict: 'employee_id' })
          .select();

        if (facultyError) {
          this.logStep('Sample Data: Faculty', false, `Failed to create faculty: ${facultyError.message}`);
        } else {
          this.logStep('Sample Data: Faculty', true, `Created ${faculty?.length || 0} faculty members`);
        }

        // Sample subjects
        const { data: subjects, error: subjectsError } = await supabase
          .from('subjects')
          .upsert([
            {
              name: 'Data Structures and Algorithms',
              code: 'CS301',
              department_id: (departments as any)[0].id,
              credits: 4,
              lectures_per_week: 3,
              labs_per_week: 1,
              requires_lab: true,
              semester: 3,
              year: 2,
              subject_type: 'core'
            },
            {
              name: 'Database Management Systems',
              code: 'IT301',
              department_id: (departments as any)[1].id,
              credits: 4,
              lectures_per_week: 3,
              labs_per_week: 1,
              requires_lab: true,
              semester: 3,
              year: 2,
              subject_type: 'core'
            }
          ] as any, { onConflict: 'code' })
          .select();

        if (subjectsError) {
          this.logStep('Sample Data: Subjects', false, `Failed to create subjects: ${subjectsError.message}`);
        } else {
          this.logStep('Sample Data: Subjects', true, `Created ${subjects?.length || 0} subjects`);
        }

        // Sample classrooms
        const { data: classrooms, error: classroomsError } = await supabase
          .from('classrooms')
          .upsert([
            {
              room_number: 'CS101',
              building: 'Engineering Block',
              floor_number: 2,
              capacity: 60,
              type: 'lecture',
              has_projector: true,
              has_smartboard: true,
              has_ac: true
            },
            {
              room_number: 'IT-LAB1',
              building: 'Engineering Block',
              floor_number: 3,
              capacity: 30,
              type: 'lab',
              has_projector: true,
              has_computer_lab: true,
              has_ac: true
            }
          ] as any, { onConflict: 'room_number' })
          .select();

        if (classroomsError) {
          this.logStep('Sample Data: Classrooms', false, `Failed to create classrooms: ${classroomsError.message}`);
        } else {
          this.logStep('Sample Data: Classrooms', true, `Created ${classrooms?.length || 0} classrooms`);
        }

        // Sample time slots
        const { data: timeSlots, error: timeSlotsError } = await supabase
          .from('time_slots')
          .upsert([
            {
              day_of_week: 'Monday',
              start_time: '09:00:00',
              end_time: '10:00:00',
              slot_name: 'Period 1',
              slot_type: 'regular'
            },
            {
              day_of_week: 'Monday',
              start_time: '10:00:00',
              end_time: '11:00:00',
              slot_name: 'Period 2',
              slot_type: 'regular'
            },
            {
              day_of_week: 'Tuesday',
              start_time: '09:00:00',
              end_time: '10:00:00',
              slot_name: 'Tuesday Period 1',
              slot_type: 'regular'
            }
          ] as any, { onConflict: 'slot_name' })
          .select();

        if (timeSlotsError) {
          this.logStep('Sample Data: Time Slots', false, `Failed to create time slots: ${timeSlotsError.message}`);
        } else {
          this.logStep('Sample Data: Time Slots', true, `Created ${timeSlots?.length || 0} time slots`);
        }
      }

      return true;
    } catch (error) {
      this.logStep('Sample Data: Setup', false, `Sample data setup failed: ${error}`);
      return false;
    }
  }

  /**
   * Test data retrieval operations
   */
  async testDataRetrieval(): Promise<boolean> {
    try {
      // Test complex queries with joins
      const { data: departmentsWithFaculty, error: joinError } = await supabase
        .from('departments')
        .select(`
          *,
          faculty(*)
        `)
        .limit(5);

      if (joinError) {
        this.logStep('Data Retrieval: Joins', false, `Join query failed: ${joinError.message}`);
        return false;
      }

      this.logStep('Data Retrieval: Joins', true, `Retrieved ${departmentsWithFaculty?.length || 0} departments with faculty`);

      // Test filtering and pagination
      const { data: filteredData, error: filterError } = await supabase
        .from('faculty')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (filterError) {
        this.logStep('Data Retrieval: Filtering', false, `Filter query failed: ${filterError.message}`);
        return false;
      }

      this.logStep('Data Retrieval: Filtering', true, `Retrieved ${filteredData?.length || 0} active faculty members`);

      return true;
    } catch (error) {
      this.logStep('Data Retrieval: Operations', false, `Data retrieval test failed: ${error}`);
      return false;
    }
  }

  /**
   * Generate final report
   */
  generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('DATABASE SETUP AND VERIFICATION COMPLETE');
    console.log('='.repeat(80));

    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const successRate = Math.round((successful / total) * 100);

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Steps: ${total}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${total - successful}`);
    console.log(`   Success Rate: ${successRate}%`);

    if (successRate >= 90) {
      console.log('\n🎉 DATABASE IS READY FOR PRODUCTION!');
      console.log('   All data will be properly stored in and retrieved from the database.');
    } else if (successRate >= 70) {
      console.log('\n⚠️  DATABASE SETUP MOSTLY SUCCESSFUL');
      console.log('   Some issues detected. Review failed steps above.');
    } else {
      console.log('\n❌ DATABASE SETUP NEEDS ATTENTION');
      console.log('   Multiple issues detected. Please fix errors before proceeding.');
    }

    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.step}: ${result.message}`);
    });

    console.log('\n🔗 Available API Endpoints:');
    console.log('   GET  /api/database/test-connection    - Test database connectivity');
    console.log('   POST /api/database/verify-crud        - Verify CRUD operations');
    console.log('   GET  /api/database/status             - Get database statistics');
    console.log('   POST /api/database/populate-sample    - Add sample data');
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Run complete database setup and verification
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Database Setup and Verification...\n');

    const steps = [
      { name: 'Connection Test', method: () => this.testConnection() },
      { name: 'Table Verification', method: () => this.verifyTables() },
      { name: 'CRUD Operations', method: () => this.testCRUDOperations() },
      { name: 'Sample Data Setup', method: () => this.setupSampleData() },
      { name: 'Data Retrieval Test', method: () => this.testDataRetrieval() }
    ];

    for (const step of steps) {
      console.log(`\n📋 Running: ${step.name}...`);
      await step.method();
    }

    this.generateReport();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

export default DatabaseSetup;