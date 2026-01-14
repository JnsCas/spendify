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
