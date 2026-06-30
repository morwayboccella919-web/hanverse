import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password?: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-register: create user if they don't exist
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: email.split("@")[0],
          passwordHash: password ? await bcrypt.hash(password, 10) : null,
          lastActiveDate: new Date(),
        },
      });
    } else if (password && user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException("Invalid credentials");
      }
    }

    // Update last active date
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveDate: new Date() },
    });

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: this.sanitizeUser(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return {
      id: safe.id,
      email: safe.email,
      display_name: safe.displayName,
      hsk_level: safe.hskLevel,
      credits_remaining: safe.creditsRemaining,
      streak_days: safe.streakDays,
      max_streak: safe.maxStreak,
      last_active_date: safe.lastActiveDate?.toISOString().split("T")[0] ?? null,
      total_xp: safe.totalXp,
      created_at: safe.createdAt?.toISOString() ?? null,
    };
  }
}
