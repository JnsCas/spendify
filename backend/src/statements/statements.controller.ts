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
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { StatementsService, RangeSummaryResponse } from './statements.service';
import { Statement } from './statement.entity';
import {
  BulkUploadResponseDto,
  StatementStatusResponseDto,
  HasStatementsResponseDto,
  CompletingInstallmentsResponseDto,
} from './dto/bulk-upload-response.dto';

@Controller('statements')
@UseGuards(JwtAuthGuard)
export class StatementsController {
  private readonly logger = new Logger(StatementsController.name);

  constructor(private statementsService: StatementsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'application/pdf' }),
          new MaxFileSizeValidator({ maxSize: 500 * 1024 }), // 500KB
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Statement> {
    return this.statementsService.create(user.id, file);
  }

  @Post('upload-bulk')
  @UseInterceptors(
    FilesInterceptor('files', 12, {
      limits: {
        fileSize: 500 * 1024, // 500KB per file
      },
    }),
  )
  async uploadBulk(
    @Req() req: Request,
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BulkUploadResponseDto> {
    this.logger.log(`uploadBulk called - Content-Length: ${req.headers['content-length']}`);
    this.logger.log(`Files received: ${files?.length ?? 'none'}`);
    if (files?.length) {
      files.forEach((f, i) => this.logger.log(`  File ${i + 1}: ${f.originalname} (${f.size} bytes)`));
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    for (const file of files) {
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException(
          `File ${file.originalname} is not a PDF`,
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
    @Query('endYear') endYear?: string,
    @Query('endMonth') endMonth?: string,
  ): Promise<Statement[]> {
    const endYearNum = endYear ? parseInt(endYear, 10) : undefined;
    const endMonthNum = endMonth ? parseInt(endMonth, 10) : undefined;

    if (endYearNum && endMonthNum) {
      return this.statementsService.findAllByUserInDateRange(
        user.id,
        endYearNum,
        endMonthNum,
      );
    }
    return this.statementsService.findAllByUser(user.id);
  }

  @Get('summary')
  async getSummary(
    @CurrentUser() user: User,
    @Query('endYear') endYear?: string,
    @Query('endMonth') endMonth?: string,
  ): Promise<RangeSummaryResponse> {
    const now = new Date();
    const endYearNum = endYear ? parseInt(endYear, 10) : now.getFullYear();
    const endMonthNum = endMonth ? parseInt(endMonth, 10) : now.getMonth() + 1;
    return this.statementsService.getSummaryByUserDateRange(
      user.id,
      endYearNum,
      endMonthNum,
    );
  }

  @Get('processing')
  async getProcessing(@CurrentUser() user: User): Promise<Statement[]> {
    return this.statementsService.findPendingOrProcessing(user.id);
  }

  @Get('completing-installments')
  async getCompletingInstallments(
    @CurrentUser() user: User,
    @Query('year') yearParam?: string,
    @Query('month') monthParam?: string,
  ): Promise<CompletingInstallmentsResponseDto> {
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    const result = await this.statementsService.getCompletingInstallments(
      user.id,
      year,
      month,
    );

    return {
      statementMonth: `${year}-${String(month).padStart(2, '0')}`,
      installments: result.installments.map((i) => ({
        id: i.id,
        description: i.description,
        amountArs: i.amountArs,
        amountUsd: i.amountUsd,
        currentInstallment: i.currentInstallment,
        totalInstallments: i.totalInstallments,
        cardId: i.cardId,
        customName: i.customName,
        lastFourDigits: i.lastFourDigits,
      })),
      totalArs: result.totalArs,
      totalUsd: result.totalUsd,
    };
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
