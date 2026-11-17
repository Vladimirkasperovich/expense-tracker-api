import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { UserService } from "../user/user.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { hash, verify } from "argon2";
import { Prisma, User } from "../generated/prisma/client.js";
import { LoginDto } from "./dto/login.dto.js";
import { TokenService } from "../token/token.service.js";
import { randomUUID } from "crypto";
import type { LoginServiceResult } from "./types/auth.types.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<LoginServiceResult> {
    const { email, name, password } = dto;
    const userExist = await this.userService.findByEmail(email);

    if (userExist) {
      throw new ConflictException("User with this email has been registered");
    }

    let user: Omit<User, "password">;
    try {
      user = await this.prismaService.user.create({
        data: {
          name,
          email,
          password: await hash(password),
        },
        omit: { password: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          throw new ConflictException("User with this email already exists");
        }
      }
      throw e;
    }

    const userData = { id: user.id, name: user.name, role: user.role, email: user.email };
    return this.createSession(userData);
  }

  async login(dto: LoginDto): Promise<LoginServiceResult> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Incorrect email or password");
    }

    const isPasswordValid = await verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect email or password");
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const { sid, sub } = await this.tokenService.verifyRefreshToken(refreshToken);

    const session = await this.prismaService.session.findUnique({
      where: { id: sid, userId: sub },
    });

    if (!session) {
      throw new UnauthorizedException("Session not found");
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session expired");
    }

    const validRefreshToken = await verify(session.refreshToken, refreshToken);

    if (!validRefreshToken) {
      throw new UnauthorizedException("Refresh token is not valid");
    }
  }
  private async createSession(
    user: Pick<User, "id" | "name" | "role" | "email">,
  ): Promise<LoginServiceResult> {
    const sessionId = randomUUID();
    const accessToken = await this.tokenService.generateAccessToken(user.id, user.role);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, sessionId);

    await this.prismaService.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken: await hash(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
