import "server-only";

/**
 * The simulator writes real rows into the real CRM. That is exactly what makes
 * it useful in development and exactly what makes it dangerous in production,
 * so it is off unless a deploy opts in.
 */
export function simulatorEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_SIMULATOR === "1";
}
