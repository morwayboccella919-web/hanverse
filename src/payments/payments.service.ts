import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import Stripe from "stripe";

const PRICE_MAP: Record<string, { amount_cents: number; credits: number }> = {
  single: { amount_cents: 99, credits: 1 },
  "5pack": { amount_cents: 399, credits: 5 },
  "10pack": { amount_cents: 699, credits: 10 },
  "30pack": { amount_cents: 1799, credits: 30 },
  "100pack": { amount_cents: 4999, credits: 100 },
};

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2025-06-30.acacia" as any,
    });
  }

  async createCheckout(userId: string, pkg: string) {
    const price = PRICE_MAP[pkg];
    if (!price) {
      throw new BadRequestException(
        `Invalid package: ${pkg}. Valid: ${Object.keys(PRICE_MAP).join(", ")}`,
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `HanVerse ${pkg} Credits`,
              description: `${price.credits} assessment credits`,
            },
            unit_amount: price.amount_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
      metadata: {
        userId,
        package: pkg,
      },
    });

    await this.prisma.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amountCents: price.amount_cents,
        currency: "usd",
        package: pkg,
        creditsPurchased: price.credits,
        status: "pending",
      },
    });

    return { stripe_session_url: session.url };
  }
}