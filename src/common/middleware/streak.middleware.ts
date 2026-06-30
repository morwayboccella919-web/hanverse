import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class StreakMiddleware implements NestMiddleware {
  private readonly logger = new Logger(StreakMiddleware.name);

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      // Streak tracking handled by AuthService on login and by dedicated interceptor/guard
      // Middleware just logs activity for now
      const user = (req as any).user;
      if (user?.id) {
        this.logger.debug(`Activity from user: ${user.id}`);
      }
      next();
    } catch (err) {
      this.logger.error("Streak middleware error", err);
      next();
    }
  }
}