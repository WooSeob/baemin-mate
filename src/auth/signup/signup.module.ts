import { Module } from "@nestjs/common";
import { SignupController } from "./signup.controller";
import { SignupService } from "./signup.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UniversityEmailAuthEntity } from "./entity/university-email-auth.entity";
import { OAuthModule } from "../oauth/OAuthModule";
import { UniversityModule } from "../../university/university.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UniversityEmailAuthEntity]),
    OAuthModule,
    UniversityModule,
  ],
  controllers: [SignupController],
  providers: [SignupService],
})
export class SignupModule {}
