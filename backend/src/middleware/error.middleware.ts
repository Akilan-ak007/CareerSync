import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred. Please try again later.';

  // Intercept Prisma database connection issues in production
  if (err.code === 'P1001' || err.name === 'PrismaClientInitializationError' || message.includes('localhost:5432') || message.includes('Can\'t reach database server')) {
    message = 'Database Connection Error: Unable to reach PostgreSQL database. Please verify DATABASE_URL is set in Vercel Environment Variables (Neon, Supabase, or cloud DB).';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
