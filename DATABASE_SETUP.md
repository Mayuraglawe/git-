# 🗄️ Database Setup & Verification Guide

## Overview
This guide ensures that **everything is stored in and retrieved from the database** properly in your Py-Gram 2k25 timetable management system.

## 🚀 Quick Database Test

### Method 1: Using the Setup Script
```bash
cd server
npx tsx setup-database.ts
```

### Method 2: Using API Endpoints (Server must be running)
```bash
# Start your server first
npm run dev

# Then test in another terminal:
curl http://localhost:3000/api/database/test-connection
curl -X POST http://localhost:3000/api/database/verify-crud
curl http://localhost:3000/api/database/status
curl -X POST http://localhost:3000/api/database/populate-sample
```

## 📊 Database Status Dashboard

Access these endpoints to monitor your database:

- **GET** `/api/database/test-connection` - Test basic connectivity
- **POST** `/api/database/verify-crud` - Test create, read, update, delete operations
- **GET** `/api/database/status` - Get comprehensive database statistics
- **POST** `/api/database/populate-sample` - Add sample data for testing

## 🔧 What Gets Stored in Database

### 1. **Academic Entities**
- ✅ **Departments** → `departments` table
- ✅ **Faculty** → `faculty` table  
- ✅ **Students/Batches** → `student_batches` table
- ✅ **Subjects** → `subjects` table

### 2. **Infrastructure**
- ✅ **Classrooms** → `classrooms` table
- ✅ **Time Slots** → `time_slots` table
- ✅ **Equipment & Resources** → stored as JSON in classroom records

### 3. **Timetable Data**
- ✅ **Timetables** → `timetables` table
- ✅ **Scheduled Classes** → `scheduled_classes` table
- ✅ **Conflict Detection** → computed from database relationships
- ✅ **Approval Workflow** → status tracking in database

### 4. **Assignments & Events**
- ✅ **Faculty-Subject Assignments** → `faculty_subject_assignments` table
- ✅ **Batch-Subject Assignments** → `batch_subject_assignments` table
- ✅ **College Events** → `college_events` table

### 5. **Academic Information**
- ✅ **Exam Information** → `exam_information` table
- ✅ **Assignment Information** → `assignment_information` table

## 📈 Data Flow Verification

### How Data is Stored:
1. **Frontend** sends request → **API Endpoint**
2. **API** validates data → **Supabase Client**
3. **Supabase** stores in → **PostgreSQL Database**
4. **Response** confirms → **Data Persistence**

### How Data is Retrieved:
1. **Frontend** requests data → **API Endpoint**
2. **API** queries → **Supabase Database**
3. **Database** returns → **Structured JSON**
4. **API** formats → **Response to Frontend**

## 🔍 Testing Data Persistence

### 1. Create Test Data
```bash
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Department", 
    "code": "TD001",
    "description": "Testing data persistence"
  }'
```

### 2. Verify Storage
```bash
curl http://localhost:3000/api/departments
```

### 3. Test Updates
```bash
curl -X PUT http://localhost:3000/api/departments/1 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```

### 4. Confirm Persistence
```bash
curl http://localhost:3000/api/departments/1
```

## 🛡️ Data Validation & Security

### Row Level Security (RLS)
- ✅ **Department-based access control**
- ✅ **User authentication via Supabase Auth**
- ✅ **Role-based permissions** (HOD, Faculty, Admin)

### Data Validation
- ✅ **Server-side validation** in all API endpoints
- ✅ **Database constraints** (foreign keys, check constraints)
- ✅ **TypeScript type safety** throughout the application

## 📋 Complete API Coverage

### **65+ Database-Connected Endpoints:**

#### Departments (8 endpoints)
- `GET /api/departments` - List all departments (from database)
- `POST /api/departments` - Create department (stored in database)
- `PUT /api/departments/:id` - Update department (persisted to database)
- `DELETE /api/departments/:id` - Remove from database
- `POST /api/departments/:id/assign-hod` - Update HOD in database
- `GET /api/departments/:id/faculty` - Retrieve associated faculty from database
- `GET /api/departments/:id/statistics` - Calculate from database data
- `GET /api/departments/:id` - Fetch single department from database

#### Faculty (8 endpoints)
- `GET /api/faculty` - All faculty from database
- `POST /api/faculty` - Store new faculty in database
- `PUT /api/faculty/:id` - Update faculty record in database
- `DELETE /api/faculty/:id` - Remove faculty from database
- `GET /api/faculty/:id/subjects` - Get assigned subjects from database
- `POST /api/faculty/:id/subjects` - Store subject assignment in database
- `GET /api/faculty/:id/workload` - Calculate from database assignments
- `GET /api/faculty/:id` - Fetch single faculty from database

#### Subjects (8 endpoints)
- All operations store/retrieve from `subjects` table
- Prerequisite relationships maintained in database
- Department associations via foreign keys

#### Classrooms (9 endpoints)
- All infrastructure data stored in `classrooms` table
- Equipment information stored as JSON
- Availability tracking in database

#### Student Batches (9 endpoints)
- Student group data in `student_batches` table
- Coordinator assignments via foreign keys
- Academic progression tracked in database

#### Timetables (9 endpoints)
- Core timetable data in `timetables` table
- Status workflow managed in database
- Version control via database fields

#### Scheduled Classes (7 endpoints)
- Individual class records in `scheduled_classes` table
- Resource allocation via database relationships
- Conflict detection through database queries

#### Assignments (7 endpoints)
- Faculty-subject links in `faculty_subject_assignments` table
- Batch-subject links in `batch_subject_assignments` table
- All assignment data persisted to database

#### Events (4+ endpoints)
- College events in `college_events` table
- Conflict tracking via database queries
- Event scheduling integrated with timetable data

## ✅ Verification Checklist

- [ ] **Server connects to Supabase** ✓
- [ ] **All 13 tables accessible** ✓
- [ ] **CRUD operations work** ✓
- [ ] **Data persists after server restart** ✓
- [ ] **Relationships maintained** ✓
- [ ] **Constraints enforced** ✓
- [ ] **Sample data can be created** ✓
- [ ] **Complex queries execute** ✓
- [ ] **API endpoints return database data** ✓
- [ ] **Real-time updates work** ✓

## 🎯 Success Indicators

When everything is working correctly, you should see:

1. ✅ **Server logs show "Database connection successful"**
2. ✅ **API endpoints return data from database tables**
3. ✅ **Changes persist after server restart**
4. ✅ **Database dashboard shows increasing record counts**
5. ✅ **All CRUD test operations succeed**
6. ✅ **Sample data populates correctly**

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection directly
npx tsx server/setup-database.ts
```

### Data Not Persisting
- Check Supabase dashboard for actual data
- Verify API endpoints use correct table names
- Ensure transactions complete successfully

### Permission Errors
- Verify service role key has admin permissions
- Check Row Level Security policies in Supabase
- Ensure table permissions are correctly set

---

**🎉 With this setup, every piece of data in your Py-Gram 2k25 system is guaranteed to be stored in and retrieved from the database!**