import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Statement, StatementStatus } from './statement.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StatementsService {
  constructor(
    @InjectRepository(Statement)
    private statementsRepository: Repository<Statement>,
    @InjectQueue('statement-processing')
    private statementQueue: Queue,
  ) {}

  async create(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Statement> {
    // Create upload directory
    const uploadDir = path.join('uploads', userId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Create statement record
    const statement = this.statementsRepository.create({
      userId,
      uploadDate: new Date(),
      originalFilename: file.originalname,
      filePath,
      status: StatementStatus.PENDING,
    });

    const savedStatement = await this.statementsRepository.save(statement);

    // Add to processing queue
    await this.statementQueue.add('process', {
      statementId: savedStatement.id,
    });

    return savedStatement;
  }

  async findAllByUser(userId: string): Promise<Statement[]> {
    return this.statementsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Statement> {
    const statement = await this.statementsRepository.findOne({
      where: { id, userId },
      relations: ['expenses', 'expenses.card'],
    });

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return statement;
  }

  async reprocess(id: string, userId: string): Promise<Statement> {
    const statement = await this.findOne(id, userId);

    // Reset status and add to queue
    statement.status = StatementStatus.PENDING;
    statement.errorMessage = null;
    await this.statementsRepository.save(statement);

    await this.statementQueue.add('process', {
      statementId: statement.id,
    });

    return statement;
  }

  async delete(id: string, userId: string): Promise<void> {
    const statement = await this.findOne(id, userId);

    // Delete file
    if (fs.existsSync(statement.filePath)) {
      fs.unlinkSync(statement.filePath);
    }

    await this.statementsRepository.remove(statement);
  }

  async updateStatus(
    id: string,
    status: StatementStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.statementsRepository.update(id, {
      status,
      errorMessage,
    });
  }

  async updateParsedData(
    id: string,
    data: {
      totalArs?: number;
      totalUsd?: number;
      dueDate?: Date;
      statementDate?: Date;
    },
  ): Promise<void> {
    await this.statementsRepository.update(id, data);
  }
}
