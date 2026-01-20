import { ExportService, MonthExportData } from '../../src/export/export.service';
import { Statement } from '../../src/statements/statement.entity';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  describe('generateMonthCsv', () => {
    it('should generate CSV with correct headers', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 0,
        totalUsd: 0,
        expenses: [],
      };

      const csv = service.generateMonthCsv(data);

      expect(csv).toContain('Description,Amount (ARS),Amount (USD),Current Installment,Total Installments,Card,Statement');
    });

    it('should include expense data in CSV', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 15000,
        totalUsd: 100,
        expenses: [
          {
            id: 'exp-1',
            description: 'Netflix Subscription',
            amountArs: 5000,
            amountUsd: null,
            currentInstallment: null,
            totalInstallments: null,
            cardId: 'card-1',
            cardCustomName: 'Visa Gold',
            cardLastFourDigits: '1234',
            statementId: 'stmt-1',
            statementFilename: 'october_2024.pdf',
          },
          {
            id: 'exp-2',
            description: 'Amazon Purchase',
            amountArs: 10000,
            amountUsd: 100,
            currentInstallment: 2,
            totalInstallments: 6,
            cardId: 'card-2',
            cardCustomName: null,
            cardLastFourDigits: '5678',
            statementId: 'stmt-1',
            statementFilename: 'october_2024.pdf',
          },
        ],
      };

      const csv = service.generateMonthCsv(data);

      expect(csv).toContain('Netflix Subscription,5000,,,,Visa Gold,october_2024.pdf');
      expect(csv).toContain('Amazon Purchase,10000,100,2,6,5678,october_2024.pdf');
    });

    it('should include summary rows', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 15000,
        totalUsd: 100,
        expenses: [
          {
            id: 'exp-1',
            description: 'Test Expense',
            amountArs: 15000,
            amountUsd: 100,
            currentInstallment: null,
            totalInstallments: null,
            cardId: 'card-1',
            cardCustomName: 'Test Card',
            cardLastFourDigits: '1234',
            statementId: 'stmt-1',
            statementFilename: 'test.pdf',
          },
        ],
      };

      const csv = service.generateMonthCsv(data);

      expect(csv).toContain('SUMMARY');
      expect(csv).toContain('Total ARS,15000');
      expect(csv).toContain('Total USD,,100');
    });

    it('should calculate installment subtotals', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 25000,
        totalUsd: 150,
        expenses: [
          {
            id: 'exp-1',
            description: 'Regular Purchase',
            amountArs: 5000,
            amountUsd: 50,
            currentInstallment: null,
            totalInstallments: null,
            cardId: 'card-1',
            cardCustomName: 'Card 1',
            cardLastFourDigits: '1234',
            statementId: 'stmt-1',
            statementFilename: 'test.pdf',
          },
          {
            id: 'exp-2',
            description: 'Installment Purchase 1',
            amountArs: 10000,
            amountUsd: null,
            currentInstallment: 2,
            totalInstallments: 6,
            cardId: 'card-1',
            cardCustomName: 'Card 1',
            cardLastFourDigits: '1234',
            statementId: 'stmt-1',
            statementFilename: 'test.pdf',
          },
          {
            id: 'exp-3',
            description: 'Installment Purchase 2',
            amountArs: 10000,
            amountUsd: 100,
            currentInstallment: 3,
            totalInstallments: 3,
            cardId: 'card-2',
            cardCustomName: 'Card 2',
            cardLastFourDigits: '5678',
            statementId: 'stmt-1',
            statementFilename: 'test.pdf',
          },
        ],
      };

      const csv = service.generateMonthCsv(data);

      // Installment subtotal should be 10000 + 10000 = 20000 ARS
      expect(csv).toContain('Installments Subtotal ARS,20000.00');
      // Installment subtotal should be 0 + 100 = 100 USD
      expect(csv).toContain('Installments Subtotal USD,,100.00');
    });

    it('should escape CSV fields with special characters', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 5000,
        totalUsd: 0,
        expenses: [
          {
            id: 'exp-1',
            description: 'Purchase with, comma',
            amountArs: 5000,
            amountUsd: null,
            currentInstallment: null,
            totalInstallments: null,
            cardId: 'card-1',
            cardCustomName: 'Test Card',
            cardLastFourDigits: '1234',
            statementId: 'stmt-1',
            statementFilename: 'test.pdf',
          },
        ],
      };

      const csv = service.generateMonthCsv(data);

      expect(csv).toContain('"Purchase with, comma"');
    });

    it('should handle empty expenses array', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 0,
        totalUsd: 0,
        expenses: [],
      };

      const csv = service.generateMonthCsv(data);

      expect(csv).toContain('SUMMARY');
      expect(csv).toContain('Total ARS,0');
      expect(csv).toContain('Total USD,,0');
      expect(csv).toContain('Installments Subtotal ARS,0.00');
      expect(csv).toContain('Installments Subtotal USD,,0.00');
    });

    it('should use card lastFourDigits when customName is not available', () => {
      const data: MonthExportData = {
        year: 2024,
        month: 10,
        totalArs: 5000,
        totalUsd: 0,
        expenses: [
          {
            id: 'exp-1',
            description: 'Test Expense',
            amountArs: 5000,
            amountUsd: null,
            currentInstallment: null,
            totalInstallments: null,
            cardId: 'card-1',
            cardCustomName: null,
            cardLastFourDigits: '9999',
            statementId: 'stmt-1',
            statementFilename: 'test.pdf',
          },
        ],
      };

      const csv = service.generateMonthCsv(data);

      expect(csv).toContain('Test Expense,5000,,,,9999,test.pdf');
    });
  });

  describe('generateCsv', () => {
    it('should generate CSV with correct headers', () => {
      const statement = {
        expenses: [],
        totalArs: 0,
        totalUsd: 0,
        dueDate: null,
      } as unknown as Statement;

      const csv = service.generateCsv(statement);

      expect(csv).toContain('Description,Amount (ARS),Amount (USD),Current Installment,Total Installments,Card,Purchase Date');
    });

    it('should include expense data', () => {
      const statement = {
        expenses: [
          {
            description: 'Test Purchase',
            amountArs: 5000,
            amountUsd: 50,
            currentInstallment: 1,
            totalInstallments: 3,
            purchaseDate: new Date('2024-01-15'),
            card: { customName: 'My Visa', lastFourDigits: '1234' },
          },
        ],
        totalArs: 5000,
        totalUsd: 50,
        dueDate: null,
      } as unknown as Statement;

      const csv = service.generateCsv(statement);

      expect(csv).toContain('Test Purchase,5000,50,1,3,My Visa,2024-01-15');
    });

    it('should include summary with totals', () => {
      const statement = {
        expenses: [],
        totalArs: 15000,
        totalUsd: 200,
        dueDate: null,
      } as unknown as Statement;

      const csv = service.generateCsv(statement);

      expect(csv).toContain('Total ARS,15000');
      expect(csv).toContain('Total USD,,200');
    });

    it('should include due date when present', () => {
      const statement = {
        expenses: [],
        totalArs: 0,
        totalUsd: 0,
        dueDate: new Date('2024-02-15'),
      } as unknown as Statement;

      const csv = service.generateCsv(statement);

      expect(csv).toContain('Due Date,2024-02-15');
    });
  });
});
