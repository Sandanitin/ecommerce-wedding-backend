import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import connectDB from './database/connect.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

// Connect to database
connectDB();

// Import and run default admin creation
import createDefaultAdmin from './scripts/createDefaultAdmin.js';
import createTestUser from './scripts/createTestUser.js';

const app = express();

// Security middleware
// Derive allowed public URLs for CSP from environment
const apiPublicUrl = process.env.API_PUBLIC_URL || '';
const extraConnectSrc = apiPublicUrl ? [apiPublicUrl] : [];
const extraImgSrc = apiPublicUrl ? [apiPublicUrl] : [];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://*.razorpay.com",
        ...extraImgSrc,
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://*.razorpay.com",
        ...extraConnectSrc,
      ],
      frameSrc: ["'self'", "https://*.razorpay.com"]
    },
  },
  // Allow cross-origin usage of static resources like images
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS configuration with strict origin validation (supports env)
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  // Production frontends on Vercel
  'https://ecommerce-wedding.vercel.app',
  'https://ecommerce-wedding-b2rmsobum-nithins-projects-1e3c272b.vercel.app'
];

// Provide additional origins via CORS_ORIGINS (comma-separated), e.g. https://your-app.vercel.app,https://api.example.com
const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// FRONTEND_URL is a single allowed origin for production frontends
const frontendUrl = (process.env.FRONTEND_URL || '').trim();

// Vercel provides VERCEL_URL without protocol; normalize it if present
const vercelUrl = (process.env.VERCEL_URL || '').trim();
const normalizedVercelOrigin = vercelUrl
  ? (vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`)
  : '';

const allowedOrigins = [
  ...defaultAllowedOrigins,
  ...envAllowedOrigins,
  ...(frontendUrl ? [frontendUrl] : []),
  ...(normalizedVercelOrigin ? [normalizedVercelOrigin] : []),
];

const isDevelopment = config.nodeEnv === 'development';

// Rate limiting (applied AFTER CORS below). Skip OPTIONS to not break preflight
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More permissive in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health'
});

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow any origin to simplify local testing across ports/devices
    if (isDevelopment) return callback(null, true);
    
    // Allow common local network origins in addition to explicit allowlist
    const localNetworkRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\\d+)?$/;

    if (allowedOrigins.includes(origin) || localNetworkRegex.test(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests with the same CORS options
app.options('*', cors(corsOptions));

// Apply rate limiter after CORS so even throttled responses include CORS headers
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static serve uploads with caching; support configurable uploads directory
const uploadsDir = process.env.UPLOADS_DIR
  ? path.isAbsolute(process.env.UPLOADS_DIR)
    ? process.env.UPLOADS_DIR
    : path.join(process.cwd(), process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(path.join(uploadsDir, 'products'))) {
  fs.mkdirSync(path.join(uploadsDir, 'products'), { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(uploadsDir, {
  maxAge: '7d',
  immutable: true,
}));

// Health check endpoint


app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Create default admin user and test user
  await createDefaultAdmin();
  await createTestUser();
});
