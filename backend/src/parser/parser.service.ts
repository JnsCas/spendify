import { Injectable, Logger } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { AnthropicService, ParsedStatement } from './anthropic.service';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private pdfService: PdfService,
    private anthropicService: AnthropicService,
  ) {}

  async parseStatement(pdfPath: string): Promise<ParsedStatement> {
    this.logger.log(`Starting to parse statement: ${pdfPath}`);

    // Extract text from PDF
    const text = await this.pdfService.extractText(pdfPath);
    if (!text || text.trim().length === 0) {
      throw new Error('No text found in PDF');
    }

    const parsed = await this.anthropicService.parseStatementText(text);

    this.logger.log(
      `Successfully parsed statement with ${parsed.expenses.length} expenses`,
    );

    return parsed;
  }
}
