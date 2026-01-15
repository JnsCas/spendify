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
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { StatementsService, StatementSummaryResponse } from './statements.service';
import { Statement } from './statement.entity';
import {
  BulkUploadResponseDto,
  StatementStatusResponseDto,
  HasStatementsResponseDto,
} from './dto/bulk-upload-response.dto';

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

  @Post('upload-bulk')
  @UseInterceptors(FilesInterceptor('files', 12))
  async uploadBulk(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BulkUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException(
          `File ${file.originalname} is not a PDF`,
        );
      }
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds maximum size of 10MB`,
        );
      }
    }

    const result = await this.statementsService.createBulk(user.id, files);

    return {
      statements: result.statements.map((s) => ({
        id: s.id,
        originalFilename: s.originalFilename,
        status: s.status,
      })),
      duplicates: result.duplicates,
      totalQueued: result.statements.length,
    };
  }

  @Get('status')
  async getStatuses(
    @CurrentUser() user: User,
    @Query('ids') ids: string,
  ): Promise<StatementStatusResponseDto> {
    const idArray = ids ? ids.split(',').filter((id) => id.trim()) : [];
    const statements = await this.statementsService.findByIds(idArray, user.id);

    return {
      statuses: statements.map((s) => ({
        id: s.id,
        status: s.status,
        errorMessage: s.errorMessage,
      })),
    };
  }

  @Get('has-any')
  async hasAny(@CurrentUser() user: User): Promise<HasStatementsResponseDto> {
    const hasStatements = await this.statementsService.hasAnyByUser(user.id);
    return { hasStatements };
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

  @Get('processing')
  async getProcessing(@CurrentUser() user: User): Promise<Statement[]> {
    return this.statementsService.findPendingOrProcessing(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Statement> {
    return this.statementsService.findOne(id, user.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.statementsService.delete(id, user.id);
  }
}
