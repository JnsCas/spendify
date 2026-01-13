import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InviteCode, InviteCodeStatus } from './invite-code.entity';
import { InviteCodeRepository } from './invite-code.repository';
import { generateInviteCode } from '../common/utils/generate-invite-code';

@Injectable()
export class InviteCodesService {
  constructor(private readonly inviteCodeRepository: InviteCodeRepository) {}

  async generate(): Promise<InviteCode> {
    let code: string;
    let exists = true;

    while (exists) {
      code = generateInviteCode();
      const existing = await this.inviteCodeRepository.findByCode(code);
      exists = !!existing;
    }

    return this.inviteCodeRepository.create(code!);
  }

  async findAll(): Promise<InviteCode[]> {
    return this.inviteCodeRepository.findAllWithRelations();
  }

  async validateAndUse(code: string, userId: string): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findByCode(code);

    if (!inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }

    if (inviteCode.status === InviteCodeStatus.USED) {
      throw new ConflictException('Invite code has already been used');
    }

    inviteCode.status = InviteCodeStatus.USED;
    inviteCode.usedById = userId;
    inviteCode.usedAt = new Date();

    await this.inviteCodeRepository.save(inviteCode);
  }

  async delete(id: string): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findById(id);

    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    if (inviteCode.status === InviteCodeStatus.USED) {
      throw new BadRequestException('Cannot delete a used invite code');
    }

    await this.inviteCodeRepository.remove(inviteCode);
  }
}
