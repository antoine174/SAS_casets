'use strict';

// Load .env for local testing of serverless function directly
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB Connection (cached for serverless warm reuse) ────────────────────
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  isConnected = true;
  console.log('[MongoDB] Connected');
}

// Run DB connection before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    res.status(503).json({ success: false, error: 'Database unavailable' });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: Bulk-import routes MUST be mounted BEFORE generic parts routes
// to prevent Express matching 'bulk-analyze' as a :id param.
app.use('/api/parts',     require('./_routes/bulkImport'));
app.use('/api/suppliers', require('./_routes/suppliers'));
app.use('/api/cars',      require('./_routes/cars'));
app.use('/api/parts',     require('./_routes/parts'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', ts: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
