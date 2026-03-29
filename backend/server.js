require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('./middleware/auth');
const chatRoutes = require('./routes/chat');
const jobRoutes = require('./routes/jobs');
const profileRoutes = require('./routes/profile');
const skillRoutes = require('./routes/skills');
const mentorRoutes = require('./routes/mentor');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://skillforge-ai-three.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowed.some(a => origin.startsWith(a))) {
      callback(null, true);
    } else {
      console.log('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'AI rate limit reached, please wait a moment.' }
});

app.use('/api/', limiter);
app.use('/api/chat', aiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/skills', authMiddleware, skillRoutes);
app.use('/api/mentor', authMiddleware, mentorRoutes);

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Career Platform API running on http://localhost:${PORT}`);
});