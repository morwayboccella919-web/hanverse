import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ShareService } from "./share.service";

@Controller("api/share")
@UseGuards(AuthGuard("jwt"))
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post("generate")
  async generate(@Req() req: any, @Body() body: { assessment_id: string }) {
    return this.shareService.generate(req.user.id, body.assessment_id);
  }
}