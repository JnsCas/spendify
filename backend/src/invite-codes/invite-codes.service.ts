import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCode, InviteCodeStatus } from './invite-code.entity';
import { generateInviteCode } from '../common/utils/generate-invite-code';

@Injectable()
export class InviteCodesService {
  constructor(
    @InjectRepository(InviteCode)
    private inviteCodesRepository: Repository<InviteCode>,
  ) {}

  async generate(): Promise<InviteCode> {
    let code: string;
    let exists = true;

    while (exists) {
      code = generateInviteCode();
      const existing = await this.inviteCodesRepository.findOne({
        where: { code },
      });
      exists = !!existing;
    }

    const inviteCode = this.inviteCodesRepository.create({
      code: code!,
      status: InviteCodeStatus.AVAILABLE,
    });

    return this.inviteCodesRepository.save(inviteCode);
  }

  async findAll(): Promise<InviteCode[]> {
    return this.inviteCodesRepository.find({
      relations: ['usedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async validateAndUse(code: string, userId: string): Promise<void> {
    const inviteCode = await this.inviteCodesRepository.findOne({
      where: { code },
    });

    if (!inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }

    if (inviteCode.status === InviteCodeStatus.USED) {
      throw new ConflictException('Invite code has already been used');
    }

    inviteCode.status = InviteCodeStatus.USED;
    inviteCode.usedById = userId;
    inviteCode.usedAt = new Date();

    await this.inviteCodesRepository.save(inviteCode);
  }

  async delete(id: string): Promise<void> {
    const inviteCode = await this.inviteCodesRepository.findOne({
      where: { id },
    });

    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    if (inviteCode.status === InviteCodeStatus.USED) {
      throw new BadRequestException('Cannot delete a used invite code');
    }

    await this.inviteCodesRepository.remove(inviteCode);
  }
}
