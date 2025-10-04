import { Router } from "express";
import { getSupabaseClient, Database } from "../../shared/supabase";
import { notificationService, notificationStore } from "../services/notificationService";

const router = Router();
const supabase = getSupabaseClient();

// Types for the new generation data
interface ExamInfo {
  id?: string;
  type: 'midterm' | 'endterm';
  subject: string;
  date: string;
  time: string;
  duration?: string;
  instructions?: string;
  topics?: string;
  creator_id: string;
  department_id: string;
  created_at?: string;
}

interface AssignmentInfo {
  id?: string;
  title: string;
  subject: string;
  due_date: string;
  due_time?: string;
  description?: string;
  submission_format?: string;
  max_marks?: string;
  creator_id: string;
  department_id: string;
  created_at?: string;
}

// Mock database storage (in production, this would be Supabase)
const mockExamDatabase: ExamInfo[] = [];
const mockAssignmentDatabase: AssignmentInfo[] = [];

// Create exam information
router.post("/exams", async (req, res) => {
  try {
    const examData: ExamInfo = {
      id: `exam_${Date.now()}`,
      type: req.body.type,
      subject: req.body.subject,
      date: req.body.date,
      time: req.body.time,
      duration: req.body.duration || '',
      instructions: req.body.instructions || '',
      topics: req.body.topics || '',
      creator_id: req.body.creator_id,
      department_id: req.body.department_id,
      created_at: new Date().toISOString()
    };

    // Validate required fields
    if (!examData.type || !examData.subject || !examData.date || !examData.time) {
      return res.status(400).json({
        error: "Missing required fields: type, subject, date, and time are required"
      });
    }

    // Mock database save
    mockExamDatabase.push(examData);
    console.log("✅ Exam saved to mock database:", examData);

    // Send notifications to students and publishers
    try {
      await notificationService.sendExamNotifications(
        examData.creator_id,
        examData.department_id,
        examData.id!,
        {
          type: examData.type,
          subject: examData.subject,
          date: examData.date,
          time: examData.time,
          duration: examData.duration,
          instructions: examData.instructions,
          topics: examData.topics,
          creatorName: 'Creator', // In production, fetch actual creator name
          departmentName: 'Department' // In production, fetch actual department name
        }
      );
    } catch (notificationError) {
      console.error("Failed to send exam notifications:", notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      message: "Exam information created successfully and notifications sent",
      data: examData
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get exam information for a department
router.get("/exams/:departmentId", async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Filter mock data by department
    const departmentExams = mockExamDatabase.filter(exam => exam.department_id === departmentId);
    
    // Apply pagination
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedExams = departmentExams.slice(startIndex, endIndex);

    console.log(`📚 Retrieved ${paginatedExams.length} exams for department ${departmentId}`);

    res.json({
      data: paginatedExams,
      count: paginatedExams.length
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create assignment information
router.post("/assignments", async (req, res) => {
  try {
    const assignmentData: AssignmentInfo = {
      id: `assignment_${Date.now()}`,
      title: req.body.title,
      subject: req.body.subject,
      due_date: req.body.dueDate,
      due_time: req.body.dueTime || '',
      description: req.body.description || '',
      submission_format: req.body.submissionFormat || '',
      max_marks: req.body.maxMarks || '',
      creator_id: req.body.creator_id,
      department_id: req.body.department_id,
      created_at: new Date().toISOString()
    };

    // Validate required fields
    if (!assignmentData.title || !assignmentData.subject || !assignmentData.due_date) {
      return res.status(400).json({
        error: "Missing required fields: title, subject, and due_date are required"
      });
    }

    // Mock database save
    mockAssignmentDatabase.push(assignmentData);
    console.log("✅ Assignment saved to mock database:", assignmentData);

    // Send notifications to students and publishers
    try {
      await notificationService.sendAssignmentNotifications(
        assignmentData.creator_id,
        assignmentData.department_id,
        assignmentData.id!,
        {
          title: assignmentData.title,
          subject: assignmentData.subject,
          dueDate: assignmentData.due_date,
          dueTime: assignmentData.due_time,
          description: assignmentData.description,
          maxMarks: assignmentData.max_marks,
          submissionFormat: assignmentData.submission_format,
          creatorName: 'Creator', // In production, fetch actual creator name
          departmentName: 'Department' // In production, fetch actual department name
        }
      );
    } catch (notificationError) {
      console.error("Failed to send assignment notifications:", notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      message: "Assignment information created successfully and notifications sent",
      data: assignmentData
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get assignment information for a department
router.get("/assignments/:departmentId", async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Filter mock data by department
    const departmentAssignments = mockAssignmentDatabase.filter(assignment => assignment.department_id === departmentId);
    
    // Apply pagination
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedAssignments = departmentAssignments.slice(startIndex, endIndex);

    console.log(`📝 Retrieved ${paginatedAssignments.length} assignments for department ${departmentId}`);

    res.json({
      data: paginatedAssignments,
      count: paginatedAssignments.length
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get upcoming exams and assignments for a department (combined view)
router.get("/upcoming/:departmentId", async (req, res) => {
  try {
    const { departmentId } = req.params;
    const currentDate = new Date().toISOString().split('T')[0];

    // Get upcoming exams from mock database
    const upcomingExams = mockExamDatabase
      .filter(exam => exam.department_id === departmentId && exam.date >= currentDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);

    // Get upcoming assignments from mock database
    const upcomingAssignments = mockAssignmentDatabase
      .filter(assignment => assignment.department_id === departmentId && assignment.due_date >= currentDate)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 10);

    // Combine and sort by date
    const combined = [
      ...upcomingExams.map(exam => ({ ...exam, type: 'exam', eventDate: exam.date })),
      ...upcomingAssignments.map(assignment => ({ ...assignment, type: 'assignment', eventDate: assignment.due_date }))
    ].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

    console.log(`📅 Retrieved ${combined.length} upcoming items for department ${departmentId}`);

    res.json({
      data: combined,
      count: combined.length
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete exam information
router.delete("/exams/:examId", async (req, res) => {
  try {
    const { examId } = req.params;

    // Find exam in mock database
    const examIndex = mockExamDatabase.findIndex(exam => exam.id === examId);
    
    if (examIndex === -1) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Remove from mock database
    const deletedExam = mockExamDatabase.splice(examIndex, 1)[0];
    console.log(`🗑️ Deleted exam from mock database:`, deletedExam);

    res.json({
      message: "Exam information deleted successfully",
      data: deletedExam
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete assignment information
router.delete("/assignments/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment in mock database
    const assignmentIndex = mockAssignmentDatabase.findIndex(assignment => assignment.id === assignmentId);
    
    if (assignmentIndex === -1) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Remove from mock database
    const deletedAssignment = mockAssignmentDatabase.splice(assignmentIndex, 1)[0];
    console.log(`🗑️ Deleted assignment from mock database:`, deletedAssignment);

    res.json({
      message: "Assignment information deleted successfully",
      data: deletedAssignment
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get notifications for a specific user (with debug info)
router.get('/debug-notifications/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Get all notifications in storage for debugging
  const allNotifications = notificationService.getAllNotifications();
  
  // Get notifications specifically for this user
  const userNotifications = allNotifications.filter(notif => notif.to_user_id === userId);
  
  res.json({
    userId,
    userNotifications,
    allNotifications,
    totalCount: allNotifications.length,
    userCount: userNotifications.length
  });
});

// Get notifications for a specific user
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get notifications for the user using the notification service
    const userNotifications = await notificationService.getUserNotifications(userId);
    
    console.log(`📧 Retrieved ${userNotifications.length} notifications for user ${userId}`);
    
    res.json({
      data: userNotifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        exam_id: notif.exam_id,
        assignment_id: notif.assignment_id,
        from_user_id: notif.from_user_id,
        to_user_id: notif.to_user_id,
        created_at: notif.created_at,
        is_read: notif.is_read
      })),
      count: userNotifications.length
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;