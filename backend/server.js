import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRouter from './routes/auth.js';
import propertiesRouter from './routes/properties.js';
import tenantsRouter from './routes/tenants.js';
import paymentsRouter from './routes/payments.js';
import maintenanceRouter from './routes/maintenance.js';
import documentsRouter from './routes/documents.js';
import utilitiesRouter from './routes/utilities.js';
import leasesRouter from './routes/leases.js';
import unitsRouter from './routes/units.js';
import expensesRouter from './routes/expenses.js';
import analyticsRouter from './routes/analytics.js';
import uploadsRouter from './routes/uploads.js';


// Middleware
import { authenticateToken } from './middleware/auth.js'; 
import errorHandler from './middleware/errorHandler.js'; 
import { sanitizeData } from './middleware/sanitization.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Adjust for your frontend URL
  credentials: true
}));

// Helmet for security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging
app.use(morgan('dev'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitization middleware
app.use(sanitizeData);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.get('/', (req, res) => res.json({ message: 'Welcome to YeneRent API' }));
//app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Minimal OpenAPI JSON (scaffold)
app.get('/api/docs.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'YeneRent API', version: '1.0.0' },
    servers: [{ url: '/api' }, { url: '/api/v1' }],
    paths: {},
    tags: [
      { name: 'auth' }, { name: 'properties' }, { name: 'units' }, { name: 'tenants' }, { name: 'leases' },
      { name: 'payments' }, { name: 'expenses' }, { name: 'documents' }, { name: 'maintenance' }, { name: 'utilities' }, { name: 'analytics' }
    ]
  });
});

// Simple audit logger for write operations (extend to DB model later)
app.use((req, res, next) => {
  const write = ['POST','PUT','PATCH','DELETE'];
  if (!req.path.startsWith('/api')) return next();
  if (!write.includes(req.method)) return next();
  const start = Date.now();
  const userId = req.user?.userId || 'anonymous';
  res.on('finish', () => {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[AUDIT] user=${userId} method=${req.method} path=${req.originalUrl} status=${res.statusCode} durationMs=${duration}`);
  });
  next();
});

// Mount non-versioned routes (backward compatibility)
app.use('/api/auth', authRouter);
app.use('/api/uploads', uploadsRouter);

// Protected routes (non-versioned)
app.use('/api/properties', authenticateToken, propertiesRouter);
app.use('/api/tenants', authenticateToken, tenantsRouter);
app.use('/api/payments', authenticateToken, paymentsRouter);
app.use('/api/maintenance', authenticateToken, maintenanceRouter);
app.use('/api/documents', authenticateToken, documentsRouter);
app.use('/api/utilities', authenticateToken, utilitiesRouter);
app.use('/api/leases', authenticateToken, leasesRouter);
app.use('/api/units', authenticateToken, unitsRouter);
app.use('/api/expenses', authenticateToken, expensesRouter);
app.use('/api/analytics', authenticateToken, analyticsRouter);

// Versioned routes (/api/v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/properties', authenticateToken, propertiesRouter);
app.use('/api/v1/tenants', authenticateToken, tenantsRouter);
app.use('/api/v1/payments', authenticateToken, paymentsRouter);
app.use('/api/v1/maintenance', authenticateToken, maintenanceRouter);
app.use('/api/v1/documents', authenticateToken, documentsRouter);
app.use('/api/v1/utilities', authenticateToken, utilitiesRouter);
app.use('/api/v1/leases', authenticateToken, leasesRouter);
app.use('/api/v1/units', authenticateToken, unitsRouter);
app.use('/api/v1/expenses', authenticateToken, expensesRouter);
app.use('/api/v1/analytics', authenticateToken, analyticsRouter);


// Error handling middleware
app.use(errorHandler);

// 404 Not Found Middleware
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGODB_URI, {
  autoIndex: true,
}).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

export default app;
