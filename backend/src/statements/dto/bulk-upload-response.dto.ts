import { StatementStatus } from '../statement.entity';

export class BulkUploadStatementDto {
  id: string;
  originalFilename: string;
  status: StatementStatus;
}

export class DuplicateFileDto {
  originalFilename: string;
  existingStatementId: string;
  existingFilename: string;
}

export class BulkUploadResponseDto {
  statements: BulkUploadStatementDto[];
  duplicates: DuplicateFileDto[];
  totalQueued: number;
}

export class StatementStatusItemDto {
  id: string;
  status: StatementStatus;
  errorMessage: string | null;
}

export class StatementStatusResponseDto {
  statuses: StatementStatusItemDto[];
}

export class HasStatementsResponseDto {
  hasStatements: boolean;
}

export class CompletingInstallmentDto {
  id: string;
  description: string;
  amountArs: number | null;
  amountUsd: number | null;
  currentInstallment: number;
  totalInstallments: number;
  cardId: string | null;
  customName: string | null;
  lastFourDigits: string | null;
}

export class CompletingInstallmentsResponseDto {
  statementMonth: string;
  installments: CompletingInstallmentDto[];
  totalArs: number;
  totalUsd: number;
}
