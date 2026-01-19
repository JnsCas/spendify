import { Test, TestingModule } from '@nestjs/testing';
import { ParserService } from '../../src/parser/parser.service';
import { PdfService } from '../../src/parser/pdf.service';
import { AnthropicService, ParsedStatement } from '../../src/parser/anthropic.service';

describe('ParserService', () => {
  let service: ParserService;
  let pdfService: jest.Mocked<PdfService>;
  let anthropicService: jest.Mocked<AnthropicService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParserService,
        {
          provide: PdfService,
          useValue: {
            extractText: jest.fn(),
          },
        },
        {
          provide: AnthropicService,
          useValue: {
            parseStatementText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ParserService>(ParserService);
    pdfService = module.get(PdfService);
    anthropicService = module.get(AnthropicService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseStatement', () => {
    const mockPdfPath = '/path/to/statement.pdf';
    const mockExtractedText = 'Sample credit card statement text...';
    const mockParsedStatement: ParsedStatement = {
      expenses: [
        {
          description: 'Test Purchase',
          amount_ars: 1000,
          amount_usd: null,
          current_installment: null,
          total_installments: null,
          last_four_digits: '1234',
          purchase_date: '2024-01-10',
        },
      ],
      summary: {
        total_ars: 1000,
        total_usd: 0,
        due_date: '2024-02-01',
        statement_date: '2024-01-15',
      },
    };

    it('should successfully parse a PDF statement', async () => {
      pdfService.extractText.mockResolvedValue(mockExtractedText);
      anthropicService.parseStatementText.mockResolvedValue(mockParsedStatement);

      const result = await service.parseStatement(mockPdfPath);

      expect(pdfService.extractText).toHaveBeenCalledWith(mockPdfPath);
      expect(anthropicService.parseStatementText).toHaveBeenCalledWith(mockExtractedText);
      expect(result).toEqual(mockParsedStatement);
    });

    it('should throw error if no text extracted from PDF', async () => {
      pdfService.extractText.mockResolvedValue('');

      await expect(service.parseStatement(mockPdfPath)).rejects.toThrow(
        'No text found in PDF'
      );
      expect(anthropicService.parseStatementText).not.toHaveBeenCalled();
    });

    it('should throw error if text is only whitespace', async () => {
      pdfService.extractText.mockResolvedValue('   \n\t   ');

      await expect(service.parseStatement(mockPdfPath)).rejects.toThrow(
        'No text found in PDF'
      );
      expect(anthropicService.parseStatementText).not.toHaveBeenCalled();
    });

    it('should propagate errors from PDF extraction', async () => {
      const extractError = new Error('Failed to read PDF');
      pdfService.extractText.mockRejectedValue(extractError);

      await expect(service.parseStatement(mockPdfPath)).rejects.toThrow(extractError);
      expect(anthropicService.parseStatementText).not.toHaveBeenCalled();
    });

    it('should propagate errors from Anthropic parsing', async () => {
      const parseError = new Error('Failed to parse statement');
      pdfService.extractText.mockResolvedValue(mockExtractedText);
      anthropicService.parseStatementText.mockRejectedValue(parseError);

      await expect(service.parseStatement(mockPdfPath)).rejects.toThrow(parseError);
    });
  });
});
