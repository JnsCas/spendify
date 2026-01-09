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
    this.logger.log(`Parsing statement text...`);
    
    const prompt = `Parse Argentine credit card statement. Extract ALL expenses as JSON.

OUTPUT FORMAT:
{"expenses":[{"description":"str","amount_ars":num|null,"amount_usd":num|null,"current_installment":num|null,"total_installments":num|null,"card_identifier":"str"|null,"purchase_date":"YYYY-MM-DD"|null}],"summary":{"total_ars":num|null,"total_usd":num|null,"due_date":"YYYY-MM-DD"|null,"statement_date":"YYYY-MM-DD"|null}}

PARSING RULES:

1. CARD/ACCOUNT IDENTIFICATION:
   - Look for account/card info: "cuenta XXXXXXXXXX", "Tarjeta XXXX", or similar
   - Extract last 4 digits as card_identifier (e.g., "cuenta 0894140651" → "0651")
   - If multiple cards: "Tarjeta XXXX" sections → use those 4 digits for expenses in that section
   - If single account (CONSOLIDADO): use the account's last 4 digits for all consumptions
   - Tax/fee items (IIBB, IVA, IMPUESTO DE SELLOS) → card_identifier=null

2. DATE FORMATS (convert all to YYYY-MM-DD):
   - DD.MM.YY → 16.08.25 = 2025-08-16
   - DD-Mmm-YY or "DD Mmm YY" → parse day, month, year exactly as shown
   - Spanish months: Ene=01, Feb=02, Mar=03, Abr=04, May=05, Jun=06, Jul=07, Ago=08, Sep=09, Oct=10, Nov=11, Dic=12
   - CRITICAL: Parse dates EXACTLY - "24 Dic 25" = 2025-12-24 (day=24), "05 Ene 26" = 2026-01-05 (day=05)
   - For due_date/statement_date, look for "CIERRE ACTUAL", "VENCIMIENTO", "VENCIMIENTO ACTUAL" fields

3. INSTALLMENTS:
   - "Cuota XX/YY" or "C.XX/YY" → current_installment=XX, total_installments=YY
   - No installment info → both fields null

4. AMOUNTS:
   - Number format: 1.959.370,09 = 1959370.09 (dots=thousands, comma=decimal)
   - USD in description (e.g., "DIGITALOCEAN.COM USD 12,00") → amount_usd=12.00, amount_ars=null
   - Negative amounts (refunds/credits) → preserve as negative
   - Separate PESOS/DÓLARES columns → use appropriate field

5. SKIP THESE LINES:
   - Payment lines: "SU PAGO EN PESOS", "SU PAGO EN USD"
   - Balance lines: "SALDO ANTERIOR", "SALDO ACTUAL"
   - Subtotal lines: "Tarjeta XXXX Total", "TOTAL CONSUMOS DE..."
   - Credit adjustments: "CR.RG..."

6. INCLUDE:
   - All individual expense/purchase lines
   - Tax items: IMPUESTO DE SELLOS, IIBB, IVA, DB.RG (as separate expenses with card_identifier=null)

IMPORTANT: Sum of extracted amounts must match statement total. Extract ALL expenses. JSON only.

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

      this.logger.log(`Response stop_reason: ${response.stop_reason}, usage: ${JSON.stringify(response.usage)}`);

      if (response.stop_reason === 'max_tokens') {
        this.logger.warn('Response was truncated due to max_tokens limit - some expenses may be missing!');
      }

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const responseText = content.text;
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
