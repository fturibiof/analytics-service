import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [PrometheusModule.register(), AnalyticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
