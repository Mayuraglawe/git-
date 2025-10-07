import { createClient } from '@supabase/supabase-js';

// Database types for The Academic Compass timetable system - Updated to match complete schema
export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: number;
          name: string;
          code: string;
          description?: string | null;
          established_year?: number | null;
          head_of_department_id?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          building?: string | null;
          floor_number?: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Insert: {
          name: string;
          code: string;
          description?: string | null;
          established_year?: number | null;
          head_of_department_id?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          building?: string | null;
          floor_number?: number | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          code?: string;
          description?: string | null;
          established_year?: number | null;
          head_of_department_id?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          building?: string | null;
          floor_number?: number | null;
          is_active?: boolean;
        };
      };
      faculty: {
        Row: {
          id: number;
          name: string;
          employee_id: string;
          department_id: number;
          email?: string | null;
          phone_number?: string | null;
          designation?: string | null;
          qualification?: string | null;
          specialization?: string | null;
          experience_years?: number | null;
          joining_date?: string | null;
          office_location?: string | null;
          max_weekly_hours?: number | null;
          is_active: boolean;
          user_id?: string | null;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Insert: {
          name: string;
          employee_id: string;
          department_id: number;
          email?: string | null;
          phone_number?: string | null;
          designation?: string | null;
          qualification?: string | null;
          specialization?: string | null;
          experience_years?: number | null;
          joining_date?: string | null;
          office_location?: string | null;
          max_weekly_hours?: number | null;
          is_active?: boolean;
          user_id?: string | null;
        };
        Update: {
          name?: string;
          employee_id?: string;
          department_id?: number;
          email?: string | null;
          phone_number?: string | null;
          designation?: string | null;
          qualification?: string | null;
          specialization?: string | null;
          experience_years?: number | null;
          joining_date?: string | null;
          office_location?: string | null;
          max_weekly_hours?: number | null;
          is_active?: boolean;
          user_id?: string | null;
        };
      };
      subjects: {
        Row: {
          id: number;
          name: string;
          code: string;
          department_id: number;
          credits: number;
          lectures_per_week: number;
          labs_per_week: number;
          requires_lab: boolean;
          semester?: number | null;
          year?: number | null;
          subject_type?: 'core' | 'elective' | 'practical' | null;
          prerequisites?: string | null;
          syllabus?: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Insert: {
          name: string;
          code: string;
          department_id: number;
          credits: number;
          lectures_per_week: number;
          labs_per_week: number;
          requires_lab: boolean;
          semester?: number | null;
          year?: number | null;
          subject_type?: 'core' | 'elective' | 'practical' | null;
          prerequisites?: string | null;
          syllabus?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          code?: string;
          department_id?: number;
          credits?: number;
          lectures_per_week?: number;
          labs_per_week?: number;
          requires_lab?: boolean;
          semester?: number | null;
          year?: number | null;
          subject_type?: 'core' | 'elective' | 'practical' | null;
          prerequisites?: string | null;
          syllabus?: string | null;
          is_active?: boolean;
        };
      };
      classrooms: {
        Row: {
          id: number;
          room_number: string;
          building: string;
          floor_number?: number | null;
          capacity: number;
          type: 'lecture' | 'lab' | 'seminar' | 'auditorium';
          equipment?: string | null;
          has_projector: boolean;
          has_smartboard: boolean;
          has_ac: boolean;
          has_computer_lab: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Insert: {
          room_number: string;
          building: string;
          floor_number?: number | null;
          capacity: number;
          type: 'lecture' | 'lab' | 'seminar' | 'auditorium';
          equipment?: string | null;
          has_projector?: boolean;
          has_smartboard?: boolean;
          has_ac?: boolean;
          has_computer_lab?: boolean;
          is_active?: boolean;
        };
        Update: {
          room_number?: string;
          building?: string;
          floor_number?: number | null;
          capacity?: number;
          type?: 'lecture' | 'lab' | 'seminar' | 'auditorium';
          equipment?: string | null;
          has_projector?: boolean;
          has_smartboard?: boolean;
          has_ac?: boolean;
          has_computer_lab?: boolean;
          is_active?: boolean;
        };
      };
      student_batches: {
        Row: {
          id: number;
          name: string;
          batch_code: string;
          department_id: number;
          year: number;
          semester: number;
          section?: string | null;
          strength: number;
          academic_year: string;
          class_coordinator_id?: number | null;
          intake_year: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Insert: {
          name: string;
          batch_code: string;
          department_id: number;
          year: number;
          semester: number;
          section?: string | null;
          strength: number;
          academic_year: string;
          class_coordinator_id?: number | null;
          intake_year: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          batch_code?: string;
          department_id?: number;
          year?: number;
          semester?: number;
          section?: string | null;
          strength?: number;
          academic_year?: string;
          class_coordinator_id?: number | null;
          intake_year?: number;
          is_active?: boolean;
        };
      };
      time_slots: {
        Row: {
          id: number;
          day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
          start_time: string;
          end_time: string;
          slot_name: string;
          slot_type: 'regular' | 'lab' | 'break' | 'lunch';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
          start_time: string;
          end_time: string;
          slot_name: string;
          slot_type: 'regular' | 'lab' | 'break' | 'lunch';
          is_active?: boolean;
        };
        Update: {
          day_of_week?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
          start_time?: string;
          end_time?: string;
          slot_name?: string;
          slot_type?: 'regular' | 'lab' | 'break' | 'lunch';
          is_active?: boolean;
        };
      };
      timetables: {
        Row: {
          id: number;
          name: string;
          department_id: number;
          academic_year: string;
          semester: number;
          status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
          version: number;
          created_by: number;
          approved_by?: number | null;
          quality_score?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
          notes?: string | null;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Insert: {
          name: string;
          department_id: number;
          academic_year: string;
          semester: number;
          status?: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
          version?: number;
          created_by: number;
          approved_by?: number | null;
          quality_score?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          department_id?: number;
          academic_year?: string;
          semester?: number;
          status?: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
          version?: number;
          approved_by?: number | null;
          quality_score?: number | null;
          effective_from?: string | null;
          effective_to?: string | null;
          notes?: string | null;
        };
      };
      scheduled_classes: {
        Row: {
          id: number;
          timetable_id: number;
          time_slot_id: number;
          subject_id: number;
          faculty_id: number;
          batch_id: number;
          classroom_id: number;
          class_type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          timetable_id: number;
          time_slot_id: number;
          subject_id: number;
          faculty_id: number;
          batch_id: number;
          classroom_id: number;
          class_type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
          notes?: string | null;
        };
        Update: {
          timetable_id?: number;
          time_slot_id?: number;
          subject_id?: number;
          faculty_id?: number;
          batch_id?: number;
          classroom_id?: number;
          class_type?: 'lecture' | 'lab' | 'tutorial' | 'seminar';
          notes?: string | null;
        };
      };
      faculty_subject_assignments: {
        Row: {
          id: number;
          faculty_id: number;
          subject_id: number;
          proficiency_level: number;
          max_hours_per_week?: number | null;
          assignment_type: 'regular' | 'guest' | 'substitute';
          academic_year: string;
          is_primary_instructor: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          faculty_id: number;
          subject_id: number;
          proficiency_level: number;
          max_hours_per_week?: number | null;
          assignment_type?: 'regular' | 'guest' | 'substitute';
          academic_year: string;
          is_primary_instructor?: boolean;
        };
        Update: {
          faculty_id?: number;
          subject_id?: number;
          proficiency_level?: number;
          max_hours_per_week?: number | null;
          assignment_type?: 'regular' | 'guest' | 'substitute';
          academic_year?: string;
          is_primary_instructor?: boolean;
        };
      };
      batch_subject_assignments: {
        Row: {
          id: number;
          batch_id: number;
          subject_id: number;
          is_elective: boolean;
          enrollment_count?: number | null;
          academic_year: string;
          semester: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          batch_id: number;
          subject_id: number;
          is_elective?: boolean;
          enrollment_count?: number | null;
          academic_year: string;
          semester: number;
        };
        Update: {
          batch_id?: number;
          subject_id?: number;
          is_elective?: boolean;
          enrollment_count?: number | null;
          academic_year?: string;
          semester?: number;
        };
      };
      college_events: {
        Row: {
          id: number;
          title: string;
          description?: string | null;
          event_type: 'workshop' | 'seminar' | 'conference' | 'cultural' | 'sports' | 'technical' | 'examination' | 'holiday' | 'other';
          department_id?: number | null;
          organizer_id?: number | null;
          start_date: string;
          end_date: string;
          start_time?: string | null;
          end_time?: string | null;
          venue?: string | null;
          classroom_id?: number | null;
          expected_participants?: number | null;
          status: 'planned' | 'approved' | 'ongoing' | 'completed' | 'cancelled';
          priority_level: number;
          affects_timetable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          event_type: 'workshop' | 'seminar' | 'conference' | 'cultural' | 'sports' | 'technical' | 'examination' | 'holiday' | 'other';
          department_id?: number | null;
          organizer_id?: number | null;
          start_date: string;
          end_date: string;
          start_time?: string | null;
          end_time?: string | null;
          venue?: string | null;
          classroom_id?: number | null;
          expected_participants?: number | null;
          status?: 'planned' | 'approved' | 'ongoing' | 'completed' | 'cancelled';
          priority_level?: number;
          affects_timetable?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_type?: 'workshop' | 'seminar' | 'conference' | 'cultural' | 'sports' | 'technical' | 'examination' | 'holiday' | 'other';
          department_id?: number | null;
          organizer_id?: number | null;
          start_date?: string;
          end_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          venue?: string | null;
          classroom_id?: number | null;
          expected_participants?: number | null;
          status?: 'planned' | 'approved' | 'ongoing' | 'completed' | 'cancelled';
          priority_level?: number;
          affects_timetable?: boolean;
        };
      };
      exam_information: {
        Row: {
          id: string;
          type: 'midterm' | 'endterm';
          subject: string;
          date: string;
          time: string;
          duration?: string | null;
          instructions?: string | null;
          topics?: string | null;
          creator_id: string;
          department_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          type: 'midterm' | 'endterm';
          subject: string;
          date: string;
          time: string;
          duration?: string | null;
          instructions?: string | null;
          topics?: string | null;
          creator_id: string;
          department_id: string;
        };
        Update: {
          type?: 'midterm' | 'endterm';
          subject?: string;
          date?: string;
          time?: string;
          duration?: string | null;
          instructions?: string | null;
          topics?: string | null;
          creator_id?: string;
          department_id?: string;
        };
      };
      assignment_information: {
        Row: {
          id: string;
          title: string;
          subject: string;
          due_date: string;
          due_time?: string | null;
          description?: string | null;
          submission_format?: string | null;
          max_marks?: string | null;
          creator_id: string;
          department_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          subject: string;
          due_date: string;
          due_time?: string | null;
          description?: string | null;
          submission_format?: string | null;
          max_marks?: string | null;
          creator_id: string;
          department_id: string;
        };
        Update: {
          title?: string;
          subject?: string;
          due_date?: string;
          due_time?: string | null;
          description?: string | null;
          submission_format?: string | null;
          max_marks?: string | null;
          creator_id?: string;
          department_id?: string;
        };
      };
    };
  };
}

// Supabase client factory function
export function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Environment variable getters with fallbacks
export function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: check for public env vars
    return import.meta.env.VITE_SUPABASE_URL || '';
  } else {
    // Server-side: check process.env
    return process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  }
}

export function getSupabaseAnonKey(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use public anon key
    return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  } else {
    // Server-side: can use service role key for admin operations
    return process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  }
}

export function getSupabaseServiceKey(): string {
  // Only available server-side for admin operations
  if (typeof window !== 'undefined') {
    throw new Error('Service key should not be used on client-side');
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

// Default client instance
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    
    if (!url || !key) {
      throw new Error('Supabase URL and Anon Key are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
    
    supabaseClient = createSupabaseClient(url, key);
  }
  
  return supabaseClient;
}

// Admin client for server-side operations with singleton pattern
let adminClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseAdminClient() {
  // Return cached instance if available
  if (adminClient) {
    return adminClient;
  }
  
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  
  if (!url || !serviceKey) {
    throw new Error('Supabase URL and Service Role Key are required for admin operations.');
  }
  
  // Create and cache the admin client
  adminClient = createSupabaseClient(url, serviceKey);
  return adminClient;
}