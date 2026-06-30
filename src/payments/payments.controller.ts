import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PaymentsService } from "./payments.service";

@Controller("api/payments")
@UseGuards(AuthGuard("jwt"))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("create")
  async create(@Req() req: any, @Body() body: { package: string }) {
    return this.paymentsService.createCheckout(req.user.id, body.package);
  }
}