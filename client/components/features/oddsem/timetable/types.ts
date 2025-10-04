export interface DragPayload {
  type: 'faculty' | 'subject' | 'room';
  id: string;
  name?: string;
}

export interface GridCell {
  facultyId?: string;
  subjectId?: string;
  roomId?: string;
  locked?: boolean;
}

export interface RowKey {
  day: string;
  semester: string;
}

export interface Faculty {
  id: string;
  name: string;
  department?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  credits?: number;
  preferredFacultyId?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}
