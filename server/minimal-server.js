import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Minimal server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: 'Supabase configuration missing in environment variables.',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/departments?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
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
      res.status(response.status).json({ 
        success: false,
        message: 'Database connection failed',
        status: response.status,
        error: errorText
      });
    }
  } catch (error) {
    console.error('Database test endpoint error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An unexpected error occurred during the database test.', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler for routes not found
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Minimal server running on port ${port}`);
  console.log(`📡 Ping: http://localhost:${port}/api/ping`);
  console.log(`🗄️ DB Test: http://localhost:${port}/api/test`);
});

export default app;