import { Injectable } from '@nestjs/common';
import { Statement } from '../statements/statement.entity';

@Injectable()
export class ExportService {
  generateCsv(statement: Statement): string {
    const headers = [
      'Description',
      'Amount (ARS)',
      'Amount (USD)',
      'Current Installment',
      'Total Installments',
      'Card',
      'Purchase Date',
    ];

    const rows = statement.expenses.map((expense) => [
      this.escapeCsvField(expense.description),
      expense.amountArs?.toString() ?? '',
      expense.amountUsd?.toString() ?? '',
      expense.currentInstallment?.toString() ?? '',
      expense.totalInstallments?.toString() ?? '',
      expense.card?.customName || expense.card?.lastFourDigits || '',
      expense.purchaseDate
        ? new Date(expense.purchaseDate).toISOString().split('T')[0]
        : '',
    ]);

    // Add summary rows
    rows.push([]); // Empty row
    rows.push(['SUMMARY', '', '', '', '', '', '']);
    rows.push([
      'Total ARS',
      statement.totalArs?.toString() ?? '',
      '',
      '',
      '',
      '',
      '',
    ]);
    rows.push([
      'Total USD',
      '',
      statement.totalUsd?.toString() ?? '',
      '',
      '',
      '',
      '',
    ]);

    // Calculate installment subtotal
    const installmentSubtotalArs = statement.expenses
      .filter((e) => e.totalInstallments && e.totalInstallments > 1)
      .reduce((sum, e) => sum + (Number(e.amountArs) || 0), 0);

    const installmentSubtotalUsd = statement.expenses
      .filter((e) => e.totalInstallments && e.totalInstallments > 1)
      .reduce((sum, e) => sum + (Number(e.amountUsd) || 0), 0);

    rows.push([
      'Installments Subtotal ARS',
      installmentSubtotalArs.toFixed(2),
      '',
      '',
      '',
      '',
      '',
    ]);
    rows.push([
      'Installments Subtotal USD',
      '',
      installmentSubtotalUsd.toFixed(2),
      '',
      '',
      '',
      '',
    ]);

    if (statement.dueDate) {
      rows.push([
        'Due Date',
        new Date(statement.dueDate).toISOString().split('T')[0],
        '',
        '',
        '',
        '',
        '',
      ]);
    }

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
