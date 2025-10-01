import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database verification endpoints
app.get('/api/database/test-connection', async (req, res) => {
  try {
    // Simple connection test using direct query
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/departments?select=id&limit=1`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      res.json({
        success: true,
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(`Database connection failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.get('/api/database/verify-tables', async (req, res) => {
  const tables = ['departments', 'faculty', 'subjects', 'classrooms', 'student_batches'];
  const results = {};

  try {
    for (const table of tables) {
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        results[table] = {
          accessible: response.ok,
          status: response.status
        };
      } catch (error) {
        results[table] = {
          accessible: false,
          error: error.message
        };
      }
    }

    const allAccessible = Object.values(results).every(r => r.accessible);
    
    res.json({
      success: allAccessible,
      message: allAccessible ? 'All tables accessible' : 'Some tables not accessible',
      tables: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Table verification failed',
      error: error.message
    });
  }
});

app.get('/api/database/count-records', async (req, res) => {
  const tables = ['departments', 'faculty', 'subjects', 'classrooms', 'student_batches'];
  const counts = {};

  try {
    for (const table of tables) {
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const countHeader = response.headers.get('content-range');
          const count = countHeader ? parseInt(countHeader.split('/')[1]) : data.length;
          counts[table] = count;
        } else {
          counts[table] = 'Error';
        }
      } catch (error) {
        counts[table] = 'Error';
      }
    }

    res.json({
      success: true,
      message: 'Record counts retrieved',
      counts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Count retrieval failed',
      error: error.message
    });
  }
});

// CRUD Operations for Database Storage and Retrieval Testing
app.post('/api/database/test-crud/create', async (req, res) => {
  try {
    const testData = {
      departments: [
        { name: 'Computer Science', code: 'CS', description: 'Computer Science Department' },
        { name: 'Mechanical Engineering', code: 'ME', description: 'Mechanical Engineering Department' }
      ],
      faculty: [
        { name: 'Dr. John Smith', employee_id: 'FAC001', email: 'john.smith@university.edu', phone: '+1234567890' },
        { name: 'Prof. Sarah Johnson', employee_id: 'FAC002', email: 'sarah.johnson@university.edu', phone: '+1234567891' }
      ],
      subjects: [
        { name: 'Data Structures', code: 'CS101', credits: 4, semester: 3 },
        { name: 'Algorithms', code: 'CS201', credits: 4, semester: 4 }
      ]
    };

    const results = {};

    for (const [table, records] of Object.entries(testData)) {
      try {
        for (const record of records) {
          const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': process.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
          });

          if (!response.ok) {
            const error = await response.text();
            console.error(`Failed to create ${table} record:`, error);
          }
        }
        results[table] = 'Created successfully';
      } catch (error) {
        results[table] = `Error: ${error.message}`;
      }
    }

    res.json({
      success: true,
      message: 'Test data created',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CRUD create test failed',
      error: error.message
    });
  }
});

app.get('/api/database/test-crud/read', async (req, res) => {
  const tables = ['departments', 'faculty', 'subjects'];
  const data = {};

  try {
    for (const table of tables) {
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*&limit=10`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          data[table] = await response.json();
        } else {
          data[table] = 'Error reading data';
        }
      } catch (error) {
        data[table] = `Error: ${error.message}`;
      }
    }

    res.json({
      success: true,
      message: 'Data retrieved from database',
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CRUD read test failed',
      error: error.message
    });
  }
});

app.delete('/api/database/test-crud/cleanup', async (req, res) => {
  const tables = ['subjects', 'faculty', 'departments']; // Delete in reverse order for dependencies
  const results = {};

  try {
    for (const table of tables) {
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?select=id`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const records = await response.json();
          let deletedCount = 0;
          
          for (const record of records) {
            const deleteResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?id=eq.${record.id}`, {
              method: 'DELETE',
              headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (deleteResponse.ok) {
              deletedCount++;
            }
          }
          
          results[table] = `Deleted ${deletedCount} records`;
        } else {
          results[table] = 'Error during cleanup';
        }
      } catch (error) {
        results[table] = `Error: ${error.message}`;
      }
    }

    res.json({
      success: true,
      message: 'Cleanup completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CRUD cleanup test failed',
      error: error.message
    });
  }
});

// Example API routes
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Mock Faculty routes
app.get('/api/faculty', (req, res) => {
  res.json([
    { id: 1, name: 'Dr. John Smith', employee_id: 'EMP001', department: 'Computer Science' },
    { id: 2, name: 'Prof. Sarah Johnson', employee_id: 'EMP002', department: 'Computer Science' },
    { id: 3, name: 'Dr. Mike Brown', employee_id: 'EMP003', department: 'Mechanical Engineering' }
  ]);
});

app.post('/api/faculty', (req, res) => {
  const { name, employee_id, department } = req.body;
  res.json({ 
    id: Date.now(), 
    name, 
    employee_id, 
    department,
    created_at: new Date().toISOString()
  });
});

// Mock Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Mock authentication
  if ((username === 'Pygram2k25' && password === 'Pygram2k25') ||
      (username === 'pygram2k25' && password === 'pygram2k25') ||
      (username === 'admin' && password === 'password') ||
      (username === 'student1' && password === 'password')) {
    res.json({
      access: `mock_token_${Date.now()}`,
      refresh: `refresh_token_${Date.now()}`,
      user: {
        id: Date.now(),
        username,
        role: username.includes('admin') ? 'admin' : 
              username === 'Pygram2k25' ? 'creator' : 
              username === 'pygram2k25' ? 'publisher' : 'student'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Mock Telegram endpoints for testing
app.get('/api/telegram/status', (req, res) => {
  res.json({
    success: true,
    status: {
      isReady: true,
      hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasChatId: !!process.env.TELEGRAM_PRINCIPAL_CHAT_ID,
      lastChecked: new Date().toISOString()
    }
  });
});

app.post('/api/telegram/send-to-principal', (req, res) => {
  const { senderName, senderRole, senderDepartment, message, priority } = req.body;
  
  // Validate required fields
  if (!senderName || !senderRole || !senderDepartment || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: senderName, senderRole, senderDepartment, message'
    });
  }

  // Simulate successful message sending
  console.log('📨 Mock Telegram Message:');
  console.log(`From: ${senderName} (${senderRole})`);
  console.log(`Department: ${senderDepartment}`);
  console.log(`Priority: ${priority || 'medium'}`);
  console.log(`Message: ${message}`);
  console.log('---');

  res.json({
    success: true,
    message: 'Message sent to principal successfully (MOCK)',
    messageId: `mock_${Date.now()}`,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  console.log(`💚 Health: http://localhost:${port}/health`);
  console.log(`📡 Ping: http://localhost:${port}/api/ping`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});