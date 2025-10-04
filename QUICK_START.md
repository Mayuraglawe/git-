# 🚀 Quick Start Guide

## Status Check ✅

All TypeScript files are **error-free** and ready to run!

- ✅ `batches-comprehensive.ts` - 0 errors
- ✅ `faculty-comprehensive.ts` - 0 errors  
- ✅ `database-verification.ts` - 0 errors
- ✅ `subjects-comprehensive.ts` - 0 errors
- ✅ `classrooms-comprehensive.ts` - 0 errors
- ✅ `departments.ts` - 0 errors
- ✅ `minimal-server.js` - 0 errors

## 🎯 Start Your Server (Choose One)

### Option 1: Minimal Server (Fastest - Recommended for Quick Testing)

```powershell
cd C:\Users\HP\Downloads\Py-Gram_2k25
node server/minimal-server.js
```

**Endpoints Available:**
- `GET http://localhost:3001/api/ping` - Health check
- `GET http://localhost:3001/api/test` - Database connection test

---

### Option 2: Full TypeScript Server (All Features)

```powershell
cd C:\Users\HP\Downloads\Py-Gram_2k25
npx tsx server/index.ts
```

**All API Routes Available:**
- `/api/departments` - Department management
- `/api/faculty` - Faculty management
- `/api/batches` - Student batch management
- `/api/subjects` - Subject management
- `/api/classrooms` - Classroom management
- `/api/timetables` - Timetable operations
- `/api/database/*` - Database verification endpoints

---

## ⚙️ Environment Setup

### 1. Create `.env` file in root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 2. Install Dependencies (if not done):

```powershell
pnpm install
# or
npm install
```

---

## 🧪 Test Your Setup

### Test 1: Server Running
```powershell
curl http://localhost:3001/api/ping
```

**Expected Response:**
```json
{
  "message": "Minimal server is running!",
  "timestamp": "2025-10-05T...",
  "environment": "development"
}
```

### Test 2: Database Connection
```powershell
curl http://localhost:3001/api/test
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Database connection successful",
  "status": 200,
  "timestamp": "2025-10-05T..."
}
```

### Test 3: Get Departments (Full Server Only)
```powershell
curl http://localhost:3001/api/departments
```

---

## 🔧 Troubleshooting

### Problem: Port Already in Use

**Check what's using port 3001:**
```powershell
netstat -ano | Select-String "3001"
```

**Kill the process:**
```powershell
Stop-Process -Id <PID> -Force
```

### Problem: Environment Variables Not Loading

**Verify .env file location:**
- Must be in project root: `C:\Users\HP\Downloads\Py-Gram_2k25\.env`
- Not in `server/.env`

**Check if loaded:**
```powershell
# In Node.js
node -e "require('dotenv').config(); console.log(process.env.VITE_SUPABASE_URL)"
```

### Problem: Module Not Found

**Reinstall dependencies:**
```powershell
rm -r node_modules
rm pnpm-lock.yaml  # or package-lock.json
pnpm install       # or npm install
```

### Problem: TypeScript Errors

**Verify no errors:**
```powershell
npx tsc --noEmit
```

---

## 📊 Database Verification Endpoints

Once server is running, test database operations:

### 1. Connection Test
```
GET http://localhost:3001/api/database/test-connection
```

### 2. CRUD Operations Test
```
POST http://localhost:3001/api/database/verify-crud
```

### 3. Database Status
```
GET http://localhost:3001/api/database/status
```

### 4. Populate Sample Data
```
POST http://localhost:3001/api/database/populate-sample
```

---

## 📝 Development Tips

### Watch Mode (Auto-restart on changes)
```powershell
npx tsx watch server/index.ts
```

### Type Checking
```powershell
npx tsc --noEmit --watch
```

### Lint Check
```powershell
pnpm lint
```

---

## 🎉 You're All Set!

Your backend is fully configured and error-free. Choose your preferred server option above and start developing!

**Need Help?**
- Check `TYPESCRIPT_FIXES_SUMMARY.md` for detailed fix documentation
- Review error patterns and solutions
- All common issues are documented

---

**Happy Coding!** 🚀
