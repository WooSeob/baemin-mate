import { forwardRef, Module } from "@nestjs/common";
import { ContainerModule } from "../core/container/container.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [ContainerModule, forwardRef(() => UserModule), PassportModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
