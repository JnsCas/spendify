import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/resources/messages';

@Injectable()
export class AnthropicClient {
  private readonly logger = new Logger(AnthropicClient.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey });

    const model = this.configService.get<string>('ANTHROPIC_MODEL');
    if (!model) {
      throw new Error('ANTHROPIC_MODEL is required');
    }
    this.model = model;
  }

  async createMessage(prompt: string, maxTokens: number): Promise<Message> {
    this.logger.debug(`Creating message with model: ${this.model}`);

    return this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
  }
}
