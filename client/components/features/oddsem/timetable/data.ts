import type { Faculty, Subject, Room } from './types';

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const timeSlots = [
  '9:00-10:00',
  '10:00-11:00',
  '11:00-11:20',
  '11:20-12:20',
  '12:20-1:20',
  '1:20-2:20',
  '2:20-3:20',
  '3:20-4:20'
];

export const faculties: Faculty[] = [
  { id: 'f1', name: 'Prof. Aarav Sharma', department: 'Computer Engineering' },
  { id: 'f2', name: 'Prof. Kiara Singh', department: 'Computer Engineering' },
  { id: 'f3', name: 'Prof. Rohan Kumar', department: 'Computer Engineering' },
];

export const subjects: Subject[] = [
  { id: 's1', name: 'Data Structures and Algorithms', code: 'CE401', credits: 4 },
  { id: 's2', name: 'Computer Networks', code: 'CE402', credits: 3 },
  { id: 's3', name: 'Database Management', code: 'CE403', credits: 4 },
];

export const rooms: Room[] = [
  { id: 'r1', name: 'Room 101', capacity: 60 },
  { id: 'r2', name: 'Room 102', capacity: 60 },
  { id: 'r3', name: 'Lab 201', capacity: 30 },
];

export const oddSemesters = ['1', '3', '5', '7'];
export const evenSemesters = ['2', '4', '6', '8'];
