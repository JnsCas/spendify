import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const adminEmailsStr = this.configService.get<string>('ADMIN_EMAILS', '');
    const adminEmails = adminEmailsStr
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    if (!adminEmails.includes(user.email.toLowerCase())) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
