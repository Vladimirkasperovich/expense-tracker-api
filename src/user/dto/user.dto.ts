import { Role } from "../../generated/prisma/enums.js";

export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
