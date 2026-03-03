import { Request, Response, NextFunction } from "express";

/**
 * Sanitize query parameters to prevent SQL injection.
 * Strips potentially dangerous characters from string query params.
 */
export function sanitizeQuery(req: Request, _res: Response, next: NextFunction) {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        // Remove SQL injection patterns
        req.query[key] = value
          .replace(/['"\`;\\]/g, "")
          .replace(/--/g, "")
          .replace(/\/\*/g, "")
          .replace(/\*\//g, "")
          .replace(/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE)\b/gi, "");
      }
    }
  }
  next();
}

/**
 * Validate that numeric parameters are actually numbers.
 * Prevents type coercion attacks on ID parameters.
 */
export function validateNumericParams(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && isNaN(Number(value))) {
        return res.status(400).json({
          error: `Parameter "${param}" must be a number`,
        });
      }
    }
    next();
  };
}
