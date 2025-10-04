import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getFaculty, createFaculty } from "./routes/faculty";
// New comprehensive faculty routes
import {
  getAllFaculty,
  getFacultyById,
  createFacultyMember,
  updateFacultyMember,
  deleteFacultyMember,
  getFacultySubjects,
  assignSubjectToFaculty,
  getFacultyWorkload
} from "./routes/faculty-comprehensive";
import telegramRoutes from "./routes/telegram";
import { initializeTelegramService } from "./services/telegramService";
import { 
  getUserDepartments, 
  getDepartmentDetails,
  getFacultyByDepartment,
  injectDepartmentContext,
  requireDepartmentAccess 
} from "./routes/department-routes";
// New comprehensive department routes
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHOD,
  getDepartmentFaculty,
  getDepartmentStatistics
} from "./routes/departments";
// New comprehensive subject routes
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectFaculty,
  getSubjectBatches,
  getSubjectPrerequisites,
  getSubjectsByDepartment
} from "./routes/subjects-comprehensive";
// New comprehensive classroom routes
import {
  getAllClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  toggleClassroomAvailability,
  getClassroomSchedule,
  getAvailableClassrooms,
  getBuildings
} from "./routes/classrooms-comprehensive";
// New comprehensive batch routes
import {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  assignCoordinator,
  getBatchSubjects,
  assignSubjectToBatch,
  promoteBatch
} from "./routes/batches-comprehensive";
// New comprehensive timetable routes
import {
  getAllTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  approveTimetable,
  publishTimetable,
  detectConflicts
} from "./routes/timetables-comprehensive";
// New comprehensive scheduled class routes
import * as scheduledClassRoutes from "./routes/scheduled-classes-comprehensive";
// New comprehensive assignment and event routes
import * as assignmentsEventsRoutes from "./routes/assignments-events-comprehensive";
// Database verification and testing routes
import * as databaseVerificationRoutes from "./routes/database-verification";
import subjectRoutes from "./routes/subject-routes";
import classroomRoutes from "./routes/classroom-routes";
import batchRoutes from "./routes/batch-routes";
import timetableRoutes from "./routes/timetable-routes";
import newGenerationRoutes from "./routes/new-generation-routes";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Telegram service
  initializeTelegramService().then((success) => {
    if (success) {
      console.log("✅ Telegram service initialized successfully");
    } else {
      console.log("⚠️ Telegram service initialization failed - check environment variables");
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Faculty routes (comprehensive CRUD)
  app.get("/api/faculty", getAllFaculty);
  app.get("/api/faculty/:id", getFacultyById);
  app.post("/api/faculty", createFacultyMember);
  app.put("/api/faculty/:id", updateFacultyMember);
  app.delete("/api/faculty/:id", deleteFacultyMember);
  app.get("/api/faculty/:id/subjects", getFacultySubjects);
  app.post("/api/faculty/:id/subjects", assignSubjectToFaculty);
  app.get("/api/faculty/:id/workload", getFacultyWorkload);

  // Legacy faculty routes (keeping for backward compatibility)
  app.get("/api/faculty/legacy", getFaculty);
  app.post("/api/faculty/legacy", createFaculty);

  // Department routes (comprehensive CRUD)
  app.get("/api/departments", getDepartments);
  app.get("/api/departments/:id", getDepartmentById);
  app.post("/api/departments", createDepartment);
  app.put("/api/departments/:id", updateDepartment);
  app.delete("/api/departments/:id", deleteDepartment);
  app.post("/api/departments/:id/assign-hod", assignHOD);
  app.get("/api/departments/:id/faculty", getDepartmentFaculty);
  app.get("/api/departments/:id/statistics", getDepartmentStatistics);

  // Legacy department routes (keeping for backward compatibility)
  app.get("/api/departments/user", getUserDepartments);
  app.get("/api/departments/details/:departmentId", getDepartmentDetails);
  app.get("/api/departments/faculty/:departmentId", getFacultyByDepartment);

  // Subject routes (comprehensive CRUD)
  app.get("/api/subjects", getAllSubjects);
  app.get("/api/subjects/:id", getSubjectById);
  app.post("/api/subjects", createSubject);
  app.put("/api/subjects/:id", updateSubject);
  app.delete("/api/subjects/:id", deleteSubject);
  app.get("/api/subjects/:id/faculty", getSubjectFaculty);
  app.get("/api/subjects/:id/batches", getSubjectBatches);
  app.get("/api/subjects/:id/prerequisites", getSubjectPrerequisites);
  app.get("/api/subjects/by-department/:departmentId", getSubjectsByDepartment);

  // Legacy subject routes (keeping for backward compatibility)
  app.use("/api/subjects/legacy", subjectRoutes);

  // Classroom routes (comprehensive CRUD)
  app.get("/api/classrooms", getAllClassrooms);
  app.get("/api/classrooms/:id", getClassroomById);
  app.post("/api/classrooms", createClassroom);
  app.put("/api/classrooms/:id", updateClassroom);
  app.delete("/api/classrooms/:id", deleteClassroom);
  app.post("/api/classrooms/:id/toggle-availability", toggleClassroomAvailability);
  app.get("/api/classrooms/:id/schedule", getClassroomSchedule);
  app.get("/api/classrooms/available", getAvailableClassrooms);
  app.get("/api/classrooms/buildings", getBuildings);

  // Legacy classroom routes (keeping for backward compatibility)
  app.use("/api/classrooms/legacy", classroomRoutes);

  // Batch routes (comprehensive CRUD)
  app.get("/api/batches", getAllBatches);
  app.get("/api/batches/:id", getBatchById);
  app.post("/api/batches", createBatch);
  app.put("/api/batches/:id", updateBatch);
  app.delete("/api/batches/:id", deleteBatch);
  app.post("/api/batches/:id/assign-coordinator", assignCoordinator);
  app.get("/api/batches/:id/subjects", getBatchSubjects);
  app.post("/api/batches/:id/subjects", assignSubjectToBatch);
  app.post("/api/batches/:id/promote", promoteBatch);

  // Legacy batch routes (keeping for backward compatibility)
  app.use("/api/batches/legacy", batchRoutes);

  // Timetable routes (comprehensive CRUD)
  app.get("/api/timetables", getAllTimetables);
  app.get("/api/timetables/:id", getTimetableById);
  app.post("/api/timetables", createTimetable);
  app.put("/api/timetables/:id", updateTimetable);
  app.delete("/api/timetables/:id", deleteTimetable);
  app.post("/api/timetables/:id/approve", approveTimetable);
  app.post("/api/timetables/:id/publish", publishTimetable);
  app.post("/api/timetables/:id/detect-conflicts", detectConflicts);

  // Legacy timetable routes (keeping for backward compatibility)
  app.use("/api/timetables/legacy", timetableRoutes);

  // Scheduled class routes (comprehensive CRUD)
  app.get("/api/scheduled-classes", scheduledClassRoutes.getAllScheduledClasses);
  app.get("/api/scheduled-classes/:id", scheduledClassRoutes.getScheduledClassById);
  app.post("/api/scheduled-classes", scheduledClassRoutes.createScheduledClass);
  app.put("/api/scheduled-classes/:id", scheduledClassRoutes.updateScheduledClass);
  app.delete("/api/scheduled-classes/:id", scheduledClassRoutes.deleteScheduledClass);
  app.post("/api/scheduled-classes/bulk-create", scheduledClassRoutes.bulkCreateScheduledClasses);
  app.get("/api/scheduled-classes/timetable/:timetableId/grid", scheduledClassRoutes.getTimetableGrid);

  // Assignment and Event routes (comprehensive CRUD)
  app.get("/api/faculty-assignments", assignmentsEventsRoutes.getAllFacultyAssignments);
  app.post("/api/faculty-assignments", assignmentsEventsRoutes.createAssignment);
  app.delete("/api/faculty-assignments/:id", assignmentsEventsRoutes.deleteAssignment);
  app.get("/api/batch-assignments", assignmentsEventsRoutes.getAllFacultyAssignments);
  app.post("/api/batch-assignments", assignmentsEventsRoutes.createAssignment);
  app.get("/api/events", assignmentsEventsRoutes.getAllEvents);
  app.post("/api/events", assignmentsEventsRoutes.createEvent);
  app.put("/api/events/:id", assignmentsEventsRoutes.updateEvent);

  // Database verification and testing routes
  app.get("/api/database/test-connection", databaseVerificationRoutes.testDatabaseConnection);
  app.post("/api/database/verify-crud", databaseVerificationRoutes.verifyCRUDOperations);
  app.get("/api/database/status", databaseVerificationRoutes.getDatabaseStatus);
  app.post("/api/database/populate-sample", databaseVerificationRoutes.populateSampleData);

  // New Generation routes (Exam and Assignment Information)
  app.use("/api/new-generation", newGenerationRoutes);

  // Telegram routes
  app.use("/api/telegram", telegramRoutes);

  return app;
}
