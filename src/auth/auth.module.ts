import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UserModule } from "../user/user.module.js";
import { TokenService } from "../token/token.service.js";

@Module({
  imports: [PrismaModule, UserModule, TokenService],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
