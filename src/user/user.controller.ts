import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service.js";
import type { User } from "../generated/prisma/client.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findById(@Param("id") id: string): Promise<Omit<User, "password">> {
    return this.userService.findById(id);
  }
}
