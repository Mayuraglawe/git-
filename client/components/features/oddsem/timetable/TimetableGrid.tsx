import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { days, timeSlots, faculties, subjects, rooms } from "./data";
import type { DragPayload, GridCell, RowKey } from "./types";

export interface TimetableGridProps {
  grid: Record<string, GridCell[]>;
  onDropItem: (rk: RowKey, slotIndex: number, payload: DragPayload) => void;
  semesterFilter?: string | "all";
  semesters: string[];
}

function CellView({
  cell,
  onDrop,
  disabled,
}: {
  cell: GridCell;
  onDrop: (p: DragPayload) => void;
  disabled?: boolean;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      onDrop(payload);
    } catch {}
  };
  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "min-h-[64px] rounded-md border p-1 text-xs leading-tight",
        disabled && "bg-muted text-muted-foreground",
        !disabled && "bg-white hover:bg-accent/40",
      )}
    >
      {disabled ? (
        <div className="h-full w-full flex items-center justify-center font-medium">Lunch Break</div>
      ) : (
        <div className="space-y-1">
          {cell.subjectId && (
            <div className="flex items-center justify-between rounded bg-primary/5 px-2 py-1">
              <span>Subject: {cell.subjectId}</span>
            </div>
          )}
          {cell.facultyId && (
            <div className="flex items-center justify-between rounded bg-secondary/30 px-2 py-1">
              <span>Faculty: {cell.facultyId}</span>
            </div>
          )}
          {cell.roomId && (
            <div className="flex items-center justify-between rounded bg-muted px-2 py-1">
              <span>Room: {cell.roomId}</span>
            </div>
          )}
          {!cell.subjectId && !cell.facultyId && !cell.roomId && (
            <div className="text-center text-muted-foreground">Drop faculty/subject/room</div>
          )}
        </div>
      )}
    </div>
  );
}

export function TimetableGrid({ grid, onDropItem, semesterFilter = "all", semesters }: TimetableGridProps) {
  const facultyMap = useMemo(() => new Map(faculties.map((f) => [f.id, f.name])), []);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), []);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.name])), []);

  const renderCell = (rk: RowKey, slotIndex: number) => {
    const key = `${rk.day}__${rk.semester}`;
    const cell = grid[key]?.[slotIndex] ?? {};
    const mapped: GridCell = {
      ...cell,
      facultyId: cell.facultyId ? (facultyMap.get(cell.facultyId) ?? cell.facultyId) : undefined,
      subjectId: cell.subjectId ? (subjectMap.get(cell.subjectId) ?? cell.subjectId) : undefined,
      roomId: cell.roomId ? (roomMap.get(cell.roomId) ?? cell.roomId) : undefined,
      locked: cell.locked,
    };
    return (
      <CellView
        key={slotIndex}
        cell={mapped}
        disabled={mapped.locked}
        onDrop={(p) => onDropItem(rk, slotIndex, p)}
      />
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted text-foreground">
            <th className="border px-2 py-2 text-left">Day</th>
            <th className="border px-2 py-2 text-left">Semester</th>
            {timeSlots.map((t) => (
              <th key={t} className="border px-2 py-2 text-left">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const semsToRender = semesterFilter === "all" ? semesters : [semesterFilter];
            return semsToRender.map((semester) => {
              const rk = { day, semester } as RowKey;
              return (
                <tr key={`${day}-${semester}`} className="odd:bg-background even:bg-white">
                  <td className="border px-2 py-2 font-medium">{day}</td>
                  <td className="border px-2 py-2">{semester}</td>
                  {timeSlots.map((_, i) => (
                    <td key={i} className="border p-1 align-top">
                      {renderCell(rk, i)}
                    </td>
                  ))}
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}
