import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { QuestionsService } from "./questions.service";

@Controller("api/questions")
@UseGuards(AuthGuard("jwt"))
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async findAll(@Query("hsk") hsk?: number, @Query("category") category?: string) {
    return this.questionsService.findAll(hsk, category);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.questionsService.findOne(id);
  }
}
