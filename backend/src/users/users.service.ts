import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(email: string, password: string, name: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.userRepository.create({
      email,
      passwordHash,
      name,
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
