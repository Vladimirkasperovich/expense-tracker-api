import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "../../token/token.service.js";
import { AuthenticatedRequest } from "../../common/types/authenticated-request.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const headers = request.headers.authorization?.split(" ");

    if (!headers || !headers.length) {
      throw new UnauthorizedException("Headers not found");
    }

    const [authorizationSchema, token] = headers;
    if (authorizationSchema !== "Bearer") {
      throw new UnauthorizedException("Authorization schema not found");
    }
    if (!token) {
      throw new UnauthorizedException("Token not found");
    }

    const payload = await this.tokenService.verifyAccessToken(token);
    request.userId = payload.sub;
    return true;
  }
}
