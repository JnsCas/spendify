import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnthropicClient } from '../../src/parser/anthropic.client';

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

import Anthropic from '@anthropic-ai/sdk';

describe('AnthropicClient', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
  });

  describe('constructor', () => {
    it('should throw error if ANTHROPIC_API_KEY is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_API_KEY') return undefined;
        if (key === 'ANTHROPIC_MODEL') return 'claude-3-haiku-20240307';
        return undefined;
      });

      expect(
        () =>
          new AnthropicClient(mockConfigService),
      ).toThrow('ANTHROPIC_API_KEY is required');
    });

    it('should throw error if ANTHROPIC_MODEL is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_API_KEY') return 'test-api-key';
        if (key === 'ANTHROPIC_MODEL') return undefined;
        return undefined;
      });

      expect(
        () =>
          new AnthropicClient(mockConfigService),
      ).toThrow('ANTHROPIC_MODEL is required');
    });

    it('should initialize successfully with valid config', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_API_KEY') return 'test-api-key';
        if (key === 'ANTHROPIC_MODEL') return 'claude-3-haiku-20240307';
        return undefined;
      });

      const client = new AnthropicClient(mockConfigService);
      expect(client).toBeDefined();
      expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });

  describe('createMessage', () => {
    it('should call Anthropic SDK with correct parameters', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_API_KEY') return 'test-api-key';
        if (key === 'ANTHROPIC_MODEL') return 'claude-3-haiku-20240307';
        return undefined;
      });

      const mockResponse = {
        content: [{ type: 'text', text: 'response' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const client = new AnthropicClient(mockConfigService);
      const result = await client.createMessage('test prompt', 1024);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'test prompt' }],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from Anthropic SDK', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ANTHROPIC_API_KEY') return 'test-api-key';
        if (key === 'ANTHROPIC_MODEL') return 'claude-3-haiku-20240307';
        return undefined;
      });

      const mockError = new Error('API rate limit exceeded');
      const mockCreate = jest.fn().mockRejectedValue(mockError);
      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const client = new AnthropicClient(mockConfigService);
      await expect(client.createMessage('test', 1024)).rejects.toThrow(
        'API rate limit exceeded',
      );
    });
  });
});
