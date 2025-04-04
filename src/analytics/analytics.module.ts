import { Logger, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, Logger],
})
export class AnalyticsModule {}
