import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { UserService } from "../user/user.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { hash, verify } from "argon2";
import { User } from "../generated/prisma/client.js";
import { LoginDto } from "./dto/login.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, "password">> {
    const user = await this.userService.findByEmail(dto.email);

    if (user) {
      throw new ConflictException("User with this email has been registered");
    }

    return this.prismaService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await hash(dto.password),
      },
      omit: {
        password: true,
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Incorrect email or password");
    }

    const isPasswordValid = await verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect email or password");
    }
  }
}
