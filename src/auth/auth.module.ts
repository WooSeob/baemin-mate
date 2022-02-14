import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailAuth } from "./entity/email-auth.entity";

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    TypeOrmModule.forFeature([EmailAuth]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
