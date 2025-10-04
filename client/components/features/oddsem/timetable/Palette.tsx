import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faculties, subjects, rooms } from "./data";
import type { DragPayload } from "./types";

function DraggableItem({
  label,
  payload,
}: {
  label: string;
  payload: DragPayload;
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };
  return (
    <Button
      variant="secondary"
      className="w-full justify-start mb-2"
      draggable
      onDragStart={onDragStart}
    >
      {label}
    </Button>
  );
}

export function Palette() {
  const subjectItems = useMemo(
    () =>
      subjects.map((s) => ({
        key: s.id,
        label: s.name,
        payload: { type: "subject" as const, id: s.id },
      })),
    [],
  );

  const facultyItems = useMemo(
    () =>
      faculties.map((f) => ({
        key: f.id,
        label: f.name,
        payload: { type: "faculty" as const, id: f.id },
      })),
    [],
  );

  const roomItems = useMemo(
    () =>
      rooms.map((r) => ({
        key: r.id,
        label: r.name,
        payload: { type: "room" as const, id: r.id },
      })),
    [],
  );

  return (
    <div className="w-64 shrink-0 border rounded-md bg-card">
      <Accordion type="multiple" defaultValue={["faculties", "subjects", "rooms"]}>
        <AccordionItem value="faculties">
          <AccordionTrigger>Faculties</AccordionTrigger>
          <AccordionContent>
            {facultyItems.map((it) => (
              <DraggableItem key={it.key} label={it.label} payload={it.payload} />
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="subjects">
          <AccordionTrigger>Subjects</AccordionTrigger>
          <AccordionContent>
            {subjectItems.map((it) => (
              <DraggableItem key={it.key} label={it.label} payload={it.payload} />
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="rooms">
          <AccordionTrigger>Rooms</AccordionTrigger>
          <AccordionContent>
            {roomItems.map((it) => (
              <DraggableItem key={it.key} label={it.label} payload={it.payload} />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
