import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import affiliateRoutes from './routes/affiliates';
import dashboardRoutes from './routes/dashboard';
import configRoutes from './routes/config';
import otgRoutes from './routes/otg';
import dealsRoutes from './routes/deals';
import referralRoutes from './routes/referral';
import invitesRoutes from './routes/invites';
import trackingRoutes from './routes/tracking';
import { setupCronJobs } from './services/cron';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/otg', otgRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initialize cron jobs
setupCronJobs();

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
