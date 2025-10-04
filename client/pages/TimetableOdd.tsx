import TimetableWorkspace from "@/components/features/oddsem/timetable/TimetableWorkspace";
import { oddSemesters } from "@/components/features/oddsem/timetable/data";

export default function TimetableOdd() {
  return <TimetableWorkspace semesters={oddSemesters} scope="odd" />;
}
