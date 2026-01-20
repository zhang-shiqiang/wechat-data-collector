import { Controller, Get, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview(@Request() req) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const overview = await this.statisticsService.getDashboardOverview(userId);
    return {
      code: 200,
      message: '获取成功',
      data: overview,
    };
  }
}
