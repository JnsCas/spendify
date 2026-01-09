import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { InviteCodesService } from '../invite-codes/invite-codes.service';
import { User } from '../users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  isAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private inviteCodesService: InviteCodesService,
  ) {}

  async register(email: string, password: string, name: string, inviteCode: string): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create(email, password, name);

    await this.inviteCodesService.validateAndUse(inviteCode, user.id);

    return this.generateAuthResponse(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findById(payload.sub);
  }

  getMe(user: User): MeResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      isAdmin: this.isAdmin(user.email),
    };
  }

  isAdmin(email: string): boolean {
    const adminEmailsStr = this.configService.get<string>('ADMIN_EMAILS', '');
    const adminEmails = adminEmailsStr
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);
    return adminEmails.includes(email.toLowerCase());
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
