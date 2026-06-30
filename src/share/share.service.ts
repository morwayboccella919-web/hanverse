import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new NotFoundException("Assessment not found");

    // In production: generate an actual share card image via Puppeteer/Canvas
    // For now, generate a placeholder URL
    const imageUrl = `/share-cards/${assessmentId}.png`;

    const shareCard = await this.prisma.shareCard.create({
      data: {
        userId,
        assessmentId,
        imageUrl,
      },
    });

    return { image_url: shareCard.imageUrl };
  }
}
