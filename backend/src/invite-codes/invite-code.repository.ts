import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCode, InviteCodeStatus } from './invite-code.entity';

@Injectable()
export class InviteCodeRepository {
  constructor(
    @InjectRepository(InviteCode)
    private readonly repository: Repository<InviteCode>,
  ) {}

  async findByCode(code: string): Promise<InviteCode | null> {
    return this.repository.findOne({ where: { code } });
  }

  async findById(id: string): Promise<InviteCode | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAllWithRelations(): Promise<InviteCode[]> {
    return this.repository.find({
      relations: ['usedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(code: string): Promise<InviteCode> {
    const inviteCode = this.repository.create({
      code,
      status: InviteCodeStatus.AVAILABLE,
    });
    return this.repository.save(inviteCode);
  }

  async save(inviteCode: InviteCode): Promise<InviteCode> {
    return this.repository.save(inviteCode);
  }

  async remove(inviteCode: InviteCode): Promise<void> {
    await this.repository.remove(inviteCode);
  }
}
