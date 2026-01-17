import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    this.logger.log(`Incoming: ${req.method} ${req.url}`);

    const originalEnd = res.end.bind(res);
    res.end = ((...args: Parameters<Response['end']>) => {
      this.logger.log(`Response: ${req.method} ${req.url} - Status: ${res.statusCode}`);
      return originalEnd(...args);
    }) as Response['end'];

    next();
  }
}
