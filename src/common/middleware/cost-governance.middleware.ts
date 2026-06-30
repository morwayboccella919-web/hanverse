import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class CostGovernanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CostGovernanceMiddleware.name);
  private readonly rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      // IP-based rate limiting (100 requests per minute)
      const now = Date.now();
      const minuteWindow = 60 * 1000;
      const entry = this.rateLimitMap.get(ip);

      if (entry && now < entry.resetAt) {
        if (entry.count >= 100) {
          res.status(429).json({ message: "Too many requests. Please slow down." });
          return;
        }
        entry.count++;
      } else {
        this.rateLimitMap.set(ip, { count: 1, resetAt: now + minuteWindow });
      }

      next();
    } catch (err) {
      this.logger.error("Cost governance middleware error", err);
      next();
    }
  }
}