import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health endpoint: http://localhost:${PORT}/api/v1/health`);
  console.log(`=================================`);
});

// Graceful shutdown handling to prevent dangling database connections
import { prisma } from './config/db';

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing database connections...`);
  try {
    await prisma.$disconnect();
    console.log('Database connections successfully closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Prevent abrupt unhandled crashes and ensure diagnostic observability
process.on('unhandledRejection', (reason: any) => {
  console.error('💥 [Server Process] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 [Server Process] Uncaught Exception:', error);
});
