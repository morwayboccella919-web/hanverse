import { Controller, Post, Get, Param, Body, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PracticeService } from "./practice.service";

@Controller("api/practice")
@UseGuards(AuthGuard("jwt"))
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post("generate")
  async generate(@Req() req: any, @Body() body: { assessment_id: string }) {
    return this.practiceService.generate(req.user.id, body.assessment_id);
  }

  @Get(":id")
  async getDetail(@Param("id") id: string) {
    return this.practiceService.getDetail(id);
  }

  @Post(":id/submit/:task_index")
  async submitTask(
    @Param("id") id: string,
    @Param("task_index") taskIndex: number,
    @Body() body: { answer: any },
  ) {
    return this.practiceService.submitTask(id, Number(taskIndex), body.answer);
  }

  @Get(":id/result")
  async getResult(@Param("id") id: string) {
    return this.practiceService.getResult(id);
  }
}