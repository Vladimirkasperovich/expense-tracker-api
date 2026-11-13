import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ExpenseModule } from './expense/expense.module.js';
import { CategoryModule } from './category/category.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UserModule, AuthModule, ExpenseModule, CategoryModule],
})
export class AppModule {}
