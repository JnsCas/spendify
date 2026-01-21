export class InstallmentsSummaryDto {
  activeCount: number;
  completingThisMonthCount: number;
  totalRemainingArs: number;
  totalRemainingUsd: number;
}

export class InstallmentCardDto {
  id: string | null;
  customName: string | null;
  lastFourDigits: string | null;
}

export class InstallmentDetailDto {
  id: string;
  description: string;
  purchaseDate: Date | null;
  currentInstallment: number;
  totalInstallments: number;
  monthlyAmountArs: number | null;
  monthlyAmountUsd: number | null;
  remainingAmountArs: number | null;
  remainingAmountUsd: number | null;
  remainingMonths: number;
  card: InstallmentCardDto | null;
  statementMonth: string;
  status: 'active' | 'completing' | 'completed';
}

export class InstallmentsResponseDto {
  summary: InstallmentsSummaryDto;
  installments: InstallmentDetailDto[];
}
