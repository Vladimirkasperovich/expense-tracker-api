import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { Role } from "../generated/prisma/client.js";
import type { AccessTokenPayload } from "./types/access-token-payload.types.js";
import type { RefreshTokenPayload } from "./types/refresh-token-payload.types.js";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(userId: string, role: Role): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      role,
      type: "access",
    };
    return this.jwtService.signAsync(payload);
  }

  generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      jti: randomUUID(),
      type: "refresh",
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
    if (
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      !Object.values(Role).includes(payload.role) ||
      payload.type !== "access"
    ) {
      throw new UnauthorizedException("Invalid access token");
    }

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const secret = this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      typeof payload.sid !== "string" ||
      payload.sid.length === 0 ||
      typeof payload.jti !== "string" ||
      payload.jti.length === 0 ||
      payload.type !== "refresh"
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    return payload;
  }
}
