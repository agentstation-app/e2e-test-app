import { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
) {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
}