import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { AssessmentsService } from "./assessments.service";
import { diskStorage } from "multer";
import { extname } from "path";

@Controller("api/assessments")
@UseGuards(AuthGuard("jwt"))
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("audio", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Req() req: any,
    @UploadedFile() audio: any,
    @Body() body: { question_id: string },
  ) {
    return this.assessmentsService.create(req.user.id, audio, body.question_id);
  }

  @Get("history")
  async getHistory(@Req() req: any) {
    return this.assessmentsService.getHistory(req.user.id);
  }

  @Get(":id/report")
  async getReport(@Param("id") id: string) {
    return this.assessmentsService.getReport(id);
  }

  @Get(":id")
  async getStatus(@Param("id") id: string) {
    return this.assessmentsService.getStatus(id);
  }
}