import {
  Controller,
  HttpCode,
  Post,
  Res,
  Req,
  HttpStatus,
  Body,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import type { Response, Request } from "express";
import { LoginDto } from "./dto/login.dto.js";
import type { LoginResponse } from "./types/auth.types.js";
import { RegisterDto } from "./dto/register.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({ passthrough: true }) response: Response,
    @Body() body: RegisterDto,
  ): Promise<LoginResponse> {
    const { accessToken, refreshToken, user } = await this.authService.register(body);
    this.setRefreshTokenCookie(response, refreshToken);
    return { accessToken, user };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() body: LoginDto,
  ): Promise<LoginResponse> {
    const { accessToken, refreshToken, user } = await this.authService.login(body);
    this.setRefreshTokenCookie(response, refreshToken);
    return { accessToken, user };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const oldRefreshToken = request.cookies?.refresh_token;

    if (!oldRefreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }
  }
  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
