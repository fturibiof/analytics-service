import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAnalyticss', () => {
    it('should call service.getAnalytics with correct dates', async () => {
      const start = '2023-01-01';
      const end = '2023-01-31';
      const expectedResult = { analytics: [], investments: [] };
      mockAnalyticsService.getAnalytics.mockResolvedValue(expectedResult);

      const result = await controller.getAnalyticss(start, end);

      expect(service.getAnalytics).toHaveBeenCalledWith(
        new Date(start),
        new Date(end),
      );
      expect(result).toBe(expectedResult);
    });

    it('should call service.getAnalytics with undefined if dates are missing', async () => {
      await controller.getAnalyticss();
      expect(service.getAnalytics).toHaveBeenCalledWith(undefined, undefined);
    });
  });
});
