/**
 * ============================================================================
 * PY-GRAM 2K25 - DATABASE TYPES
 * Comprehensive TypeScript types for all database entities
 * Based on complete-schema-setup.sql
 * ============================================================================
 */

// ============================================================================
// BASE TYPES AND ENUMS
// ============================================================================

export type DatabaseID = number;
export type AcademicYear = string; // e.g., "2024-2025"
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Year = 1 | 2 | 3 | 4;
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Subject Types
export type SubjectType = 'core' | 'elective' | 'practical';

// Classroom Types
export type ClassroomType = 'Lecture' | 'Lab' | 'Seminar' | 'Auditorium';

// Time Slot Types
export type SlotType = 'regular' | 'lab' | 'break' | 'lunch';

// Class Types
export type ClassType = 'lecture' | 'lab' | 'tutorial' | 'seminar' | 'practical';
export type WeekPattern = 'weekly' | 'biweekly' | 'monthly';

// Timetable Status
export type TimetableStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';

// Assignment Types
export type AssignmentType = 'regular' | 'guest' | 'substitute';

// Event Types
export type EventType = 'workshop' | 'seminar' | 'conference' | 'cultural' | 'sports' | 
                       'technical' | 'orientation' | 'examination' | 'meeting' | 'holiday' | 'other';
export type EventStatus = 'planned' | 'approved' | 'rejected' | 'ongoing' | 'completed' | 'cancelled';

// Conflict Types
export type ConflictType = 'faculty_double_booking' | 'classroom_double_booking' | 'batch_double_booking' |
                          'faculty_overload' | 'classroom_capacity_exceeded' | 'equipment_mismatch';
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ConflictStatus = 'open' | 'resolved' | 'ignored';

// Change Types
export type ChangeType = 'created' | 'updated' | 'approved' | 'rejected' | 'published' | 'archived';

// Setting Types
export type SettingType = 'string' | 'number' | 'boolean' | 'json';

// ============================================================================
// CORE ACADEMIC ENTITIES
// ============================================================================

/**
 * Department - Academic departments in the institution
 */
export interface Department {
  id: DatabaseID;
  name: string;
  code: string;
  description?: string;
  head_of_department_id?: DatabaseID;
  established_year?: number;
  contact_email?: string;
  contact_phone?: string;
  building?: string;
  floor_number?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
  head_of_department_id?: DatabaseID;
  established_year?: number;
  contact_email?: string;
  contact_phone?: string;
  building?: string;
  floor_number?: number;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {}

/**
 * Faculty - Academic staff management
 */
export interface Faculty {
  id: DatabaseID;
  name: string;
  employee_id: string;
  department_id?: DatabaseID;
  email?: string;
  phone_number?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  experience_years: number;
  joining_date?: string;
  office_location?: string;
  max_weekly_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFacultyRequest {
  name: string;
  employee_id: string;
  department_id?: DatabaseID;
  email?: string;
  phone_number?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  office_location?: string;
  max_weekly_hours?: number;
}

export interface UpdateFacultyRequest extends Partial<CreateFacultyRequest> {}

/**
 * Subject - Academic courses
 */
export interface Subject {
  id: DatabaseID;
  name: string;
  code: string;
  department_id: DatabaseID;
  credits: number;
  lectures_per_week: number;
  labs_per_week: number;
  requires_lab: boolean;
  semester?: Semester;
  year?: Year;
  subject_type: SubjectType;
  prerequisites?: string;
  syllabus?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  department_id: DatabaseID;
  credits: number;
  lectures_per_week?: number;
  labs_per_week?: number;
  requires_lab?: boolean;
  semester?: Semester;
  year?: Year;
  subject_type?: SubjectType;
  prerequisites?: string;
  syllabus?: string;
}

export interface UpdateSubjectRequest extends Partial<CreateSubjectRequest> {}

/**
 * Classroom - Physical infrastructure
 */
export interface Classroom {
  id: DatabaseID;
  room_number: string;
  building: string;
  floor_number?: number;
  capacity: number;
  type: ClassroomType;
  equipment?: string;
  has_projector: boolean;
  has_smartboard: boolean;
  has_ac: boolean;
  has_computer_lab: boolean;
  accessibility_features?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClassroomRequest {
  room_number: string;
  building: string;
  floor_number?: number;
  capacity: number;
  type?: ClassroomType;
  equipment?: string;
  has_projector?: boolean;
  has_smartboard?: boolean;
  has_ac?: boolean;
  has_computer_lab?: boolean;
  accessibility_features?: string;
}

export interface UpdateClassroomRequest extends Partial<CreateClassroomRequest> {}

/**
 * Student Batch - Groups of students
 */
export interface StudentBatch {
  id: DatabaseID;
  name: string;
  batch_code: string;
  department_id: DatabaseID;
  year: Year;
  semester: Semester;
  section: string;
  strength: number;
  academic_year: AcademicYear;
  class_coordinator_id?: DatabaseID;
  intake_year: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentBatchRequest {
  name: string;
  batch_code: string;
  department_id: DatabaseID;
  year: Year;
  semester: Semester;
  section?: string;
  strength: number;
  academic_year: AcademicYear;
  class_coordinator_id?: DatabaseID;
  intake_year: number;
}

export interface UpdateStudentBatchRequest extends Partial<CreateStudentBatchRequest> {}

// ============================================================================
// TIMETABLE MANAGEMENT SYSTEM
// ============================================================================

/**
 * Time Slot - Define class periods
 */
export interface TimeSlot {
  id: DatabaseID;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_name?: string;
  slot_type: SlotType;
  duration_minutes: number; // Generated column
  is_active: boolean;
  created_at: string;
}

export interface CreateTimeSlotRequest {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_name?: string;
  slot_type?: SlotType;
}

/**
 * Timetable - Master timetable records
 */
export interface Timetable {
  id: DatabaseID;
  name: string;
  department_id?: DatabaseID;
  academic_year: AcademicYear;
  semester: Semester;
  status: TimetableStatus;
  version: number;
  created_by?: DatabaseID;
  approved_by?: DatabaseID;
  quality_score?: number;
  generation_algorithm?: string;
  generation_time_seconds?: number;
  conflict_count: number;
  optimization_notes?: string;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

export interface CreateTimetableRequest {
  name: string;
  department_id?: DatabaseID;
  academic_year: AcademicYear;
  semester: Semester;
  status?: TimetableStatus;
  version?: number;
  created_by?: DatabaseID;
  quality_score?: number;
  generation_algorithm?: string;
  generation_time_seconds?: number;
  optimization_notes?: string;
  effective_from?: string;
  effective_to?: string;
}

export interface UpdateTimetableRequest extends Partial<CreateTimetableRequest> {
  approved_by?: DatabaseID;
  conflict_count?: number;
}

/**
 * Scheduled Class - Individual class assignments
 */
export interface ScheduledClass {
  id: DatabaseID;
  timetable_id: DatabaseID;
  time_slot_id: DatabaseID;
  subject_id: DatabaseID;
  faculty_id: DatabaseID;
  batch_id: DatabaseID;
  classroom_id: DatabaseID;
  class_type: ClassType;
  week_pattern: WeekPattern;
  recurring: boolean;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledClassRequest {
  timetable_id: DatabaseID;
  time_slot_id: DatabaseID;
  subject_id: DatabaseID;
  faculty_id: DatabaseID;
  batch_id: DatabaseID;
  classroom_id: DatabaseID;
  class_type?: ClassType;
  week_pattern?: WeekPattern;
  recurring?: boolean;
  special_notes?: string;
}

export interface UpdateScheduledClassRequest extends Partial<CreateScheduledClassRequest> {}

// ============================================================================
// ASSIGNMENT AND RELATIONSHIP TABLES
// ============================================================================

/**
 * Faculty Subject Assignment - Who can teach what
 */
export interface FacultySubjectAssignment {
  id: DatabaseID;
  faculty_id: DatabaseID;
  subject_id: DatabaseID;
  proficiency_level: number;
  preferred_slots?: string; // JSON array
  max_hours_per_week: number;
  assignment_type: AssignmentType;
  academic_year?: AcademicYear;
  is_primary_instructor: boolean;
  assigned_by?: DatabaseID;
  is_active: boolean;
  created_at: string;
}

export interface CreateFacultySubjectAssignmentRequest {
  faculty_id: DatabaseID;
  subject_id: DatabaseID;
  proficiency_level?: number;
  preferred_slots?: string;
  max_hours_per_week?: number;
  assignment_type?: AssignmentType;
  academic_year?: AcademicYear;
  is_primary_instructor?: boolean;
  assigned_by?: DatabaseID;
}

/**
 * Batch Subject Assignment - Which subjects each batch studies
 */
export interface BatchSubjectAssignment {
  id: DatabaseID;
  batch_id: DatabaseID;
  subject_id: DatabaseID;
  is_elective: boolean;
  enrollment_count?: number;
  academic_year?: AcademicYear;
  semester?: Semester;
  created_at: string;
}

export interface CreateBatchSubjectAssignmentRequest {
  batch_id: DatabaseID;
  subject_id: DatabaseID;
  is_elective?: boolean;
  enrollment_count?: number;
  academic_year?: AcademicYear;
  semester?: Semester;
}

// ============================================================================
// EVENT MANAGEMENT SYSTEM
// ============================================================================

/**
 * College Event - Special events that may conflict with regular classes
 */
export interface CollegeEvent {
  id: DatabaseID;
  title: string;
  description?: string;
  event_type: EventType;
  department_id?: DatabaseID;
  organizer_id?: DatabaseID;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  classroom_id?: DatabaseID;
  expected_participants?: number;
  registration_required: boolean;
  registration_deadline?: string;
  max_registrations?: number;
  budget_allocated?: number;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  status: EventStatus;
  priority_level: number;
  affects_timetable: boolean;
  approval_required: boolean;
  approved_by?: DatabaseID;
  approved_at?: string;
  rejection_reason?: string;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCollegeEventRequest {
  title: string;
  description?: string;
  event_type: EventType;
  department_id?: DatabaseID;
  organizer_id?: DatabaseID;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  classroom_id?: DatabaseID;
  expected_participants?: number;
  registration_required?: boolean;
  registration_deadline?: string;
  max_registrations?: number;
  budget_allocated?: number;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  priority_level?: number;
  affects_timetable?: boolean;
  approval_required?: boolean;
  special_requirements?: string;
}

export interface UpdateCollegeEventRequest extends Partial<CreateCollegeEventRequest> {
  status?: EventStatus;
  approved_by?: DatabaseID;
  rejection_reason?: string;
}

// ============================================================================
// AUDIT AND LOGGING TABLES
// ============================================================================

/**
 * Timetable Change Log - Track all modifications
 */
export interface TimetableChangeLog {
  id: DatabaseID;
  timetable_id: DatabaseID;
  changed_by?: DatabaseID;
  change_type: ChangeType;
  change_description?: string;
  old_values?: Record<string, any>; // JSONB
  new_values?: Record<string, any>; // JSONB
  change_reason?: string;
  created_at: string;
}

/**
 * Schedule Conflict - Track and resolve conflicts
 */
export interface ScheduleConflict {
  id: DatabaseID;
  timetable_id: DatabaseID;
  conflict_type: ConflictType;
  affected_classes?: DatabaseID[]; // JSONB array
  conflict_description?: string;
  severity: ConflictSeverity;
  status: ConflictStatus;
  resolution_notes?: string;
  resolved_by?: DatabaseID;
  detected_at: string;
  resolved_at?: string;
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

/**
 * System Setting - Global configuration
 */
export interface SystemSetting {
  id: DatabaseID;
  setting_key: string;
  setting_value?: string;
  setting_type: SettingType;
  description?: string;
  is_system_setting: boolean;
  updated_by?: DatabaseID;
  updated_at: string;
}

/**
 * Department Preference - Department-specific settings
 */
export interface DepartmentPreference {
  id: DatabaseID;
  department_id: DatabaseID;
  preference_key: string;
  preference_value?: string;
  academic_year?: AcademicYear;
  updated_by?: DatabaseID;
  updated_at: string;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// ============================================================================

/**
 * Faculty with Department Information
 */
export interface FacultyWithDepartment extends Faculty {
  department?: Department;
}

/**
 * Subject with Department Information
 */
export interface SubjectWithDepartment extends Subject {
  department: Department;
}

/**
 * Scheduled Class with all related information
 */
export interface ScheduledClassWithDetails extends ScheduledClass {
  time_slot: TimeSlot;
  subject: Subject;
  faculty: Faculty;
  batch: StudentBatch;
  classroom: Classroom;
  timetable: Timetable;
}

/**
 * Timetable with all scheduled classes
 */
export interface TimetableWithClasses extends Timetable {
  scheduled_classes: ScheduledClassWithDetails[];
  department?: Department;
  created_by_faculty?: Faculty;
  approved_by_faculty?: Faculty;
}

/**
 * Department with statistics
 */
export interface DepartmentWithStats extends Department {
  faculty_count: number;
  subject_count: number;
  batch_count: number;
  active_timetables_count: number;
  head_of_department?: Faculty;
}

/**
 * College Event with related information
 */
export interface CollegeEventWithDetails extends CollegeEvent {
  department?: Department;
  organizer?: Faculty;
  classroom?: Classroom;
  approved_by_faculty?: Faculty;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: ScheduleConflict[];
  suggestions?: string[];
}

export interface TimetableGenerationRequest {
  department_id: DatabaseID;
  academic_year: AcademicYear;
  semester: Semester;
  algorithm?: string;
  quality_threshold?: number;
  max_generation_time?: number;
}

export interface TimetableGenerationResult {
  timetable_id: DatabaseID;
  quality_score: number;
  generation_time_seconds: number;
  conflict_count: number;
  conflicts: ScheduleConflict[];
  optimization_notes?: string;
}

// ============================================================================
// QUERY FILTERS AND SORTING
// ============================================================================

export interface QueryFilters {
  department_id?: DatabaseID;
  academic_year?: AcademicYear;
  semester?: Semester;
  is_active?: boolean;
  status?: string;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface QueryOptions extends PaginationOptions {
  filters?: QueryFilters;
  sort?: SortOptions;
  include?: string[]; // Relations to include
}