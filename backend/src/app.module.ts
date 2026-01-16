import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { dataSourceOptions } from './config/data-source';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StatementsModule } from './statements/statements.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CardsModule } from './cards/cards.module';
import { ParserModule } from './parser/parser.module';
import { ExportModule } from './export/export.module';
import { InviteCodesModule } from './invite-codes/invite-codes.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100, // 100 requests per minute for general endpoints
      },
    ]),

    // Database
    TypeOrmModule.forRoot(dataSourceOptions),

    // Redis Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    StatementsModule,
    ExpensesModule,
    CardsModule,
    ParserModule,
    ExportModule,
    InviteCodesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ]
})
export class AppModule { }
