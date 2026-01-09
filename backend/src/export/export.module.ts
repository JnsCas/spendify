import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { StatementsModule } from '../statements/statements.module';

@Module({
  imports: [StatementsModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
