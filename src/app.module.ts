import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { QuestionsModule } from "./questions/questions.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { PracticeModule } from "./practice/practice.module";
import { PaymentsModule } from "./payments/payments.module";
import { ShareModule } from "./share/share.module";
import { StreakMiddleware } from "./common/middleware/streak.middleware";
import { CostGovernanceMiddleware } from "./common/middleware/cost-governance.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    QuestionsModule,
    AssessmentsModule,
    PracticeModule,
    PaymentsModule,
    ShareModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StreakMiddleware, CostGovernanceMiddleware).forRoutes("*");
  }
}
