import type { User } from "../../generated/prisma/client.js";

export interface LoginServiceResult {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, "id" | "name" | "email">;
}

export type LoginResponse = Omit<LoginServiceResult, "refreshToken">;
