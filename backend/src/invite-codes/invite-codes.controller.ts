import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { InviteCodesService } from './invite-codes.service';
import { InviteCode } from './invite-code.entity';

@Controller('invite-codes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class InviteCodesController {
  constructor(private inviteCodesService: InviteCodesService) {}

  @Post()
  async generate(): Promise<InviteCode> {
    return this.inviteCodesService.generate();
  }

  @Get()
  async findAll(): Promise<InviteCode[]> {
    return this.inviteCodesService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.inviteCodesService.delete(id);
  }
}
