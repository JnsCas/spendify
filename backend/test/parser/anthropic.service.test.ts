import { Test, TestingModule } from '@nestjs/testing';
import {
  AnthropicService,
  ParsedStatement,
} from '../../src/parser/anthropic.service';
import { AnthropicClient } from '../../src/parser/anthropic.client';
import { Message } from '@anthropic-ai/sdk/resources/messages';

describe('AnthropicService', () => {
  let service: AnthropicService;
  let mockAnthropicClient: jest.Mocked<AnthropicClient>;

  const createMockMessage = (
    text: string,
    stopReason: string = 'end_turn',
  ): Message => ({
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text, citations: null }],
    model: 'claude-3-haiku-20240307',
    stop_reason: stopReason as Message['stop_reason'],
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  });

  const validParsedStatement: ParsedStatement = {
    expenses: [
      {
        description: 'Test Purchase',
        amount_ars: 1000,
        amount_usd: null,
        current_installment: null,
        total_installments: null,
        card_identifier: '1234',
        purchase_date: '2024-01-10',
      },
    ],
    summary: {
      total_ars: 1000,
      total_usd: null,
      due_date: '2024-02-01',
      statement_date: '2024-01-15',
    },
  };

  beforeEach(async () => {
    mockAnthropicClient = {
      createMessage: jest.fn(),
    } as unknown as jest.Mocked<AnthropicClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnthropicService,
        { provide: AnthropicClient, useValue: mockAnthropicClient },
      ],
    }).compile();

    service = module.get<AnthropicService>(AnthropicService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseStatementText', () => {
    it('should successfully parse valid JSON response', async () => {
      const jsonResponse = JSON.stringify(validParsedStatement);
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(jsonResponse),
      );

      const result = await service.parseStatementText('statement text');

      expect(mockAnthropicClient.createMessage).toHaveBeenCalledWith(
        expect.stringContaining('statement text'),
        8192,
      );
      expect(result).toEqual(validParsedStatement);
    });

    it('should extract JSON from markdown code blocks', async () => {
      const jsonResponse = `Here is the parsed data:\n\`\`\`json\n${JSON.stringify(validParsedStatement)}\n\`\`\``;
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(jsonResponse),
      );

      const result = await service.parseStatementText('statement text');

      expect(result).toEqual(validParsedStatement);
    });

    it('should extract JSON from code blocks without language specifier', async () => {
      const jsonResponse = `\`\`\`\n${JSON.stringify(validParsedStatement)}\n\`\`\``;
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(jsonResponse),
      );

      const result = await service.parseStatementText('statement text');

      expect(result).toEqual(validParsedStatement);
    });

    it('should handle trailing commas in JSON arrays', async () => {
      const jsonWithTrailingComma = `{"expenses":[{"description":"Test","amount_ars":100,"amount_usd":null,"current_installment":null,"total_installments":null,"card_identifier":"1234","purchase_date":"2024-01-10"},],"summary":{"total_ars":100,"total_usd":null,"due_date":null,"statement_date":null}}`;
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(jsonWithTrailingComma),
      );

      const result = await service.parseStatementText('statement text');

      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].description).toBe('Test');
    });

    it('should handle trailing commas in JSON objects', async () => {
      const jsonWithTrailingComma = `{"expenses":[],"summary":{"total_ars":100,"total_usd":null,"due_date":null,"statement_date":null,}}`;
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(jsonWithTrailingComma),
      );

      const result = await service.parseStatementText('statement text');

      expect(result.summary.total_ars).toBe(100);
    });

    it('should throw error when response type is not text', async () => {
      const mockMessage: Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'tool_use', id: 'tool_1', name: 'test', input: {} }],
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      };
      mockAnthropicClient.createMessage.mockResolvedValue(mockMessage);

      await expect(service.parseStatementText('statement text')).rejects.toThrow(
        'Unexpected response type',
      );
    });

    it('should throw error when no JSON found in response', async () => {
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage('Sorry, I cannot parse this statement.'),
      );

      await expect(service.parseStatementText('statement text')).rejects.toThrow(
        'No valid JSON found in response',
      );
    });

    it('should use fallback parsing when JSON is malformed but expenses array exists', async () => {
      // JSON that matches {...} regex but has invalid syntax after expenses array
      const malformedJson = `{"expenses":[{"description":"Recovered","amount_ars":500,"amount_usd":null,"current_installment":null,"total_installments":null,"card_identifier":"5678","purchase_date":"2024-01-15"}],"summary":{"total_ars":INVALID}}`;
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(malformedJson),
      );

      const result = await service.parseStatementText('statement text');

      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].description).toBe('Recovered');
      expect(result.summary.total_ars).toBeNull();
    });

    it('should throw error when JSON is malformed and no expenses array found', async () => {
      // JSON that matches {...} regex but fails to parse and has no recoverable expenses
      const malformedJson = `{"data": "broken", "items": INVALID}`;
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(malformedJson),
      );

      await expect(service.parseStatementText('statement text')).rejects.toThrow(
        'Invalid JSON in response',
      );
    });

    it('should propagate errors from AnthropicClient', async () => {
      const clientError = new Error('API connection failed');
      mockAnthropicClient.createMessage.mockRejectedValue(clientError);

      await expect(service.parseStatementText('statement text')).rejects.toThrow(
        'API connection failed',
      );
    });

    it('should include statement text in the prompt', async () => {
      const statementText = 'VISA *1234 COMPRA EN MERCADOLIBRE $5000';
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(JSON.stringify(validParsedStatement)),
      );

      await service.parseStatementText(statementText);

      expect(mockAnthropicClient.createMessage).toHaveBeenCalledWith(
        expect.stringContaining(statementText),
        8192,
      );
    });

    it('should include parsing rules in the prompt', async () => {
      mockAnthropicClient.createMessage.mockResolvedValue(
        createMockMessage(JSON.stringify(validParsedStatement)),
      );

      await service.parseStatementText('test');

      const calledPrompt = mockAnthropicClient.createMessage.mock.calls[0][0];
      expect(calledPrompt).toContain('CARD IDENTIFICATION');
      expect(calledPrompt).toContain('DATE FORMATS');
      expect(calledPrompt).toContain('INSTALLMENTS');
      expect(calledPrompt).toContain('AMOUNTS');
    });
  });
});
