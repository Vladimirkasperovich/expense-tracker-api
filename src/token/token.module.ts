import { Module } from "@nestjs/common";
import { TokenService } from "./token.service.js";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: "15m",
        },
      }),
    }),
    PrismaModule,
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
