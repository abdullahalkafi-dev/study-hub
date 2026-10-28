import type { NextFunction, Request, RequestHandler, Response } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const notFound: RequestHandler = (_req, res) => { res.status(404).json({ error: "Not found" }); };
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || (err.name === "ValidationError" || err.name === "MulterError" ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Server error" : err.message });
}
export const wrap = (fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
