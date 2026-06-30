import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, audioFile: any, questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.creditsRemaining < 1) {
      throw new BadRequestException("Insufficient credits");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { creditsRemaining: { decrement: 1 } },
    });

    const audioUrl = audioFile ? `/uploads/${audioFile.filename}` : null;

    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        questionId,
        referenceText: question.text,
        referencePinyin: question.pinyin,
        audioUrl,
        status: "pending",
      },
    });

    return { assessment_id: assessment.id };
  }

  async getStatus(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        overallScore: true,
        hskEstimate: true,
        createdAt: true,
      },
    });

    if (!assessment) throw new NotFoundException("Assessment not found");

    return {
      id: assessment.id,
      status: assessment.status,
      overall: assessment.overallScore ? Number(assessment.overallScore) : undefined,
      hsk_estimate: assessment.hskEstimate ?? undefined,
      created_at: assessment.createdAt.toISOString(),
    };
  }

  async getReport(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException("Assessment not found");

    return {
      id: assessment.id,
      status: assessment.status,
      pronunciation_score: assessment.pronunciationScore ? Number(assessment.pronunciationScore) : 0,
      tone_score: assessment.toneScore ? Number(assessment.toneScore) : 0,
      fluency_score: assessment.fluencyScore ? Number(assessment.fluencyScore) : 0,
      overall_score: assessment.overallScore ? Number(assessment.overallScore) : 0,
      hsk_estimate: assessment.hskEstimate ?? "",
      cefr_estimate: assessment.cefrEstimate ?? "",
      error_phonemes: assessment.errorPhonemes ?? {},
      explanation: assessment.explanation ?? "",
      report_data: assessment.reportData ?? {},
      created_at: assessment.createdAt.toISOString(),
    };
  }

  async getHistory(userId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { userId, status: "done" },
      select: {
        id: true,
        overallScore: true,
        hskEstimate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return assessments.map((a) => ({
      id: a.id,
      overall_score: a.overallScore ? Number(a.overallScore) : 0,
      hsk_estimate: a.hskEstimate ?? "",
      created_at: a.createdAt.toISOString(),
    }));
  }
}