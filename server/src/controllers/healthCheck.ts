import { Request, Response } from "express";
import prisma from "@/database/client";

// Global shutdown state - exposed for middleware use
export let isShuttingDown = false;

export const setShuttingDown = (value: boolean) => {
  isShuttingDown = value;
};

/**
 * Basic health check endpoint
 * Returns simple status for load balancer health probes
 */
export const healthCheck = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  // Return 503 if server is shutting down
  if (isShuttingDown) {
    return res.status(503).json({
      status: "shutting_down",
      timestamp: new Date().toISOString(),
    });
  }

  return res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
};

/**
 * Deep health check with database connectivity
 * Use for detailed health status (not load balancer)
 */
export const deepHealthCheck = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const checks: Record<
    string,
    { status: string; latency?: number; error?: string }
  > = {};
  const startTime = Date.now();

  // Database health check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Memory usage check
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  checks.memory = {
    status: heapUsedMB < heapTotalMB * 0.9 ? "healthy" : "warning",
    latency: heapUsedMB, // Using latency field for heapUsedMB
  };

  // Determine overall status
  const allHealthy = Object.values(checks).every(
    (c) => c.status === "healthy" || c.status === "warning"
  );

  const overallStatus = isShuttingDown
    ? "shutting_down"
    : allHealthy
    ? "healthy"
    : "unhealthy";

  const statusCode = isShuttingDown ? 503 : allHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    checks,
    memory: {
      heapUsedMB,
      heapTotalMB,
      percentage: Math.round((heapUsedMB / heapTotalMB) * 100),
    },
    uptime: Math.round(process.uptime()),
  });
};
