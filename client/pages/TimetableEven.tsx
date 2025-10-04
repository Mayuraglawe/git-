import TimetableWorkspace from "@/components/features/oddsem/timetable/TimetableWorkspace";
import { evenSemesters } from "@/components/features/oddsem/timetable/data";

export default function TimetableEven() {
  return <TimetableWorkspace semesters={evenSemesters} scope="even" />;
}
