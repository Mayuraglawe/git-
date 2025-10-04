import type { GridCell, RowKey } from './types';
import { days, timeSlots } from './data';

export type GridState = Record<string, GridCell[]>;

export function makeRowKey(rk: RowKey): string {
  return `${rk.day}__${rk.semester}`;
}

export function createEmptyGrid(semesters: string[]): GridState {
  const grid: GridState = {};
  for (const day of days) {
    for (const semester of semesters) {
      const key = makeRowKey({ day, semester });
      grid[key] = Array(timeSlots.length).fill(null).map(() => ({}));
      // Lock lunch slot (index 5: 1:20-2:20)
      if (grid[key][5]) {
        grid[key][5].locked = true;
      }
    }
  }
  return grid;
}

export function loadGrid(scope: string): GridState | null {
  try {
    const stored = localStorage.getItem(`timetable_${scope}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveGrid(grid: GridState, scope: string): void {
  try {
    localStorage.setItem(`timetable_${scope}`, JSON.stringify(grid));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function detectConflicts(
  grid: GridState,
  semesters: string[]
): Array<{
  type: 'faculty' | 'room';
  id: string;
  day: string;
  slotIndex: number;
  rows: RowKey[];
}> {
  const conflicts: Array<{
    type: 'faculty' | 'room';
    id: string;
    day: string;
    slotIndex: number;
    rows: RowKey[];
  }> = [];

  for (const day of days) {
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      // Check faculty conflicts
      const facultyMap = new Map<string, RowKey[]>();
      const roomMap = new Map<string, RowKey[]>();

      for (const semester of semesters) {
        const rk: RowKey = { day, semester };
        const key = makeRowKey(rk);
        const cell = grid[key]?.[slotIndex];
        
        if (cell?.facultyId) {
          const existing = facultyMap.get(cell.facultyId) || [];
          existing.push(rk);
          facultyMap.set(cell.facultyId, existing);
        }
        
        if (cell?.roomId) {
          const existing = roomMap.get(cell.roomId) || [];
          existing.push(rk);
          roomMap.set(cell.roomId, existing);
        }
      }

      // Add conflicts for faculty
      facultyMap.forEach((rows, id) => {
        if (rows.length > 1) {
          conflicts.push({ type: 'faculty', id, day, slotIndex, rows });
        }
      });

      // Add conflicts for rooms
      roomMap.forEach((rows, id) => {
        if (rows.length > 1) {
          conflicts.push({ type: 'room', id, day, slotIndex, rows });
        }
      });
    }
  }

  return conflicts;
}

export function assistantGreet(): {
  id: string;
  role: 'assistant';
  content: string;
  ts: number;
} {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: 'Hi! I can help you build the timetable. Ask me to "check conflicts" or "suggest empty slots".',
    ts: Date.now(),
  };
}
