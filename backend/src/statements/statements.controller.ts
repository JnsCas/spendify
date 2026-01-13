import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import {
  StatementsService,
  StatementSummaryResponse,
} from './statements.service';
import { Statement } from './statement.entity';

@Controller('statements')
@UseGuards(JwtAuthGuard)
export class StatementsController {
  constructor(private statementsService: StatementsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'application/pdf' }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Statement> {
    return this.statementsService.create(user.id, file);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<Statement[]> {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) : undefined;

    if (yearNum || monthNum) {
      return this.statementsService.findAllByUserFiltered(
        user.id,
        yearNum,
        monthNum,
      );
    }
    return this.statementsService.findAllByUser(user.id);
  }

  @Get('summary')
  async getSummary(
    @CurrentUser() user: User,
    @Query('year') year?: string,
  ): Promise<StatementSummaryResponse> {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.statementsService.getSummaryByUser(user.id, yearNum);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Statement> {
    return this.statementsService.findOne(id, user.id);
  }

  @Post(':id/reprocess')
  async reprocess(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Statement> {
    return this.statementsService.reprocess(id, user.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.statementsService.delete(id, user.id);
  }
}
