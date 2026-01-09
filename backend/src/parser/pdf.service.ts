import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as pdf from 'pdf-parse';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async extractText(pdfPath: string): Promise<string> {
    this.logger.log(`Extracting text from PDF: ${pdfPath}`);

    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer);

      this.logger.log(
        `Extracted ${data.numpages} pages, ${data.text.length} characters`,
      );

      return data.text;
    } catch (error) {
      this.logger.error(`Failed to extract text from PDF: ${error.message}`);
      throw error;
    }
  }
}
