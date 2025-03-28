import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get()
  async getAnalyticss(
    @Query('start') start?: string,
    @Query('end') end?: string
  ): Promise<any[]> {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return await this.analyticsService.getAnalytics(startDate, endDate);
  }
}