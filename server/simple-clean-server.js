import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint
app.get('/api/database/test', async (req, res) => {
  try {
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Supabase configuration missing',
        details: {
          hasUrl: !!process.env.VITE_SUPABASE_URL,
          hasKey: !!process.env.VITE_SUPABASE_ANON_KEY
        }
      });
    }

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
        status: response.status,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorText = await response.text();
      res.status(500).json({ 
        success: false, 
        message: 'Database connection failed',
        status: response.status,
        error: errorText
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database test failed', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple department list endpoint
app.get('/api/departments', async (req, res) => {
  try {
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/departments?select=*`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      res.json({ 
        success: true, 
        data,
        count: data.length,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorText = await response.text();
      res.status(response.status).json({ 
        success: false, 
        message: 'Failed to fetch departments',
        error: errorText
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch departments', 
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('simple-clean-server.js')) {
  app.listen(port, () => {
    console.log(`🚀 Simple server running on port ${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`📡 Ping: http://localhost:${port}/api/ping`);
    console.log(`🗄️ Database test: http://localhost:${port}/api/database/test`);
  });
}

export default app;