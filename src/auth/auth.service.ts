import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { UserService } from "../user/user.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { hash, verify } from "argon2";
import { Prisma, User } from "../generated/prisma/client.js";
import { LoginDto } from "./dto/login.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, "password">> {
    const { email, name, password } = dto;
    const user = await this.userService.findByEmail(email);

    if (user) {
      throw new ConflictException("User with this email has been registered");
    }

    try {
      return await this.prismaService.user.create({
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
