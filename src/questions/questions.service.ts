import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(hsk?: number, category?: string) {
    const where: any = {};
    if (hsk) where.hskLevel = Number(hsk);
    if (category) where.category = category;

    return this.prisma.question.findMany({
      where,
      select: {
        id: true,
        text: true,
        pinyin: true,
        hskLevel: true,
        category: true,
        syllableCount: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        pinyin: true,
        hskLevel: true,
        category: true,
        syllableCount: true,
      },
    });
  }
}
