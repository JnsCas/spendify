import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteCode } from './invite-code.entity';
import { InviteCodeRepository } from './invite-code.repository';
import { InviteCodesService } from './invite-codes.service';
import { InviteCodesController } from './invite-codes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InviteCode])],
  controllers: [InviteCodesController],
  providers: [InviteCodeRepository, InviteCodesService],
  exports: [InviteCodesService],
})
export class InviteCodesModule {}
