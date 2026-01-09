import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ParsedExpense {
  description: string;
  amount_ars: number | null;
  amount_usd: number | null;
  current_installment: number | null;
  total_installments: number | null;
  card_identifier: string | null;
  purchase_date: string | null;
}

export interface ParsedStatement {
  expenses: ParsedExpense[];
  summary: {
    total_ars: number | null;
    total_usd: number | null;
    due_date: string | null;
    statement_date: string | null;
  };
}

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
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

  async parseStatementText(text: string): Promise<ParsedStatement> {
    this.logger.log(`Parsing statement text: ${text}`);
    
    const prompt = `Parse credit card statement. Extract ALL expenses (~47 total) as JSON.

OUTPUT: {"expenses":[{"description":"str","amount_ars":num|null,"amount_usd":num|null,"current_installment":num|null,"total_installments":num|null,"card_identifier":"str"|null,"purchase_date":"YYYY-MM-DD"|null}],"summary":{"total_ars":num|null,"total_usd":num|null,"due_date":"YYYY-MM-DD"|null,"statement_date":"YYYY-MM-DD"|null}}

CARD ASSIGNMENT - card = NEXT Tarjeta's number:
Line: PROVINCIA COMPRAS...  → card="2898" (next Tarjeta is 2898)
Line: Tarjeta 2898 Total    → SKIP
Line: OLIVIA...             → card="7070" (next Tarjeta is 7070)
Line: Tarjeta 7070 Total    → SKIP
Line: DLO*PRET...           → card="8375" (next Tarjeta is 8375)
Line: Tarjeta 8375 Total    → SKIP
Line: IMPUESTO DE SELLOS    → card=null (no more Tarjeta lines after this)

Extract ALL expenses from document, not just examples. Include IMPUESTO DE SELLOS with card=null.
IMPORTANT: Sum of all expense amounts MUST equal the statement total. If sum doesn't match, you're missing expenses.
Rules: Cuota XX/YY=installments. 1.959.370,09=1959370.09. 16.08.25=2025-08-16. JSON only.

${text}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Log response details for debugging
      this.logger.log(`Response stop_reason: ${response.stop_reason}, usage: ${JSON.stringify(response.usage)}`);

      // Check if response was truncated
      if (response.stop_reason === 'max_tokens') {
        this.logger.warn('Response was truncated due to max_tokens limit - some expenses may be missing!');
      }

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const responseText = content.text;

      // Extract JSON from response
      let jsonStr = responseText;
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.error(`No JSON found in response: ${responseText}`);
        throw new Error('No valid JSON found in response');
      }

      let jsonToParse = jsonMatch[0];

      // Clean up common JSON issues
      jsonToParse = jsonToParse
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/,\s*}/g, '}') // Remove trailing commas in objects
        .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters

      let parsed: ParsedStatement;
      try {
        parsed = JSON.parse(jsonToParse) as ParsedStatement;
      } catch (parseError) {
        this.logger.error(`JSON parse error: ${parseError.message}`);
        this.logger.error(
          `JSON snippet around error: ${jsonToParse.substring(11200, 11300)}`,
        );

        // Try to salvage partial JSON by finding complete expenses array
        const expensesMatch = jsonToParse.match(
          /"expenses"\s*:\s*\[([\s\S]*?)\]/,
        );
        if (expensesMatch) {
          const fallbackJson = `{"expenses":[${expensesMatch[1]}],"summary":{"total_ars":null,"total_usd":null,"due_date":null,"statement_date":null}}`;
          try {
            parsed = JSON.parse(fallbackJson) as ParsedStatement;
            this.logger.warn(
              `Used fallback parsing, recovered ${parsed.expenses.length} expenses`,
            );
          } catch {
            throw new Error(`Invalid JSON in response: ${parseError.message}`);
          }
        } else {
          throw new Error(`Invalid JSON in response: ${parseError.message}`);
        }
      }

      this.logger.log(`Parsed ${parsed.expenses.length} expenses`);

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse statement: ${error.message}`);
      throw error;
    }
  }
}
