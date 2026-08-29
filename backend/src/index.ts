import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load Environment variables
dotenv.config();

// Import Routers
import authRouter from './routes/auth.routes.js';
import studentRouter from './routes/student.routes.js';
import companyRouter from './routes/company.routes.js';
import driveRouter from './routes/drive.routes.js';
import offerRouter from './routes/offer.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import auditRouter from './routes/audit.routes.js';
import userRouter from './routes/user.routes.js';
import notificationRouter from './routes/notification.routes.js';
import atsRouter from './routes/ats.routes.js';

// Error Middleware
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS — allow local dev + any Vercel deployment URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  /\.vercel\.app$/,
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Loggers
app.use(morgan('dev'));

// Payload Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use('/uploads', express.static('uploads'));

// Serve API routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/companies', companyRouter);
app.use('/api/placement-drives', driveRouter);
app.use('/api/offers', offerRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/users', userRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/ats', atsRouter);

// Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Placement Platform API is online.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Centralized error handler
app.use(errorHandler);

// Export app for Vercel serverless runtime
export default app;

// Start local server only outside Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`[API Server] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}
