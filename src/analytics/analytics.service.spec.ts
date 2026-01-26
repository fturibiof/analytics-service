import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as moment from 'moment';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalytics', () => {
    const start = new Date('2023-01-01');
    const end = new Date('2023-01-31');
    const url = 'http://finance-service';

    beforeEach(() => {
      process.env.URL = url;
    });

    it('should return grouped analytics and investments', async () => {
      const mockBudgets: AxiosResponse = {
        data: [{ id: 1, category: 'Food', amount: 500 }],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      const mockTransactions: AxiosResponse = {
        data: [
          { id: 1, category: 'Food', amount: 50, date: new Date() },
          { id: 2, category: 'Food', amount: 100, date: new Date() },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      const mockInvestments: AxiosResponse = {
        data: [
          {
            id: 1,
            name: 'Apple',
            ticker: 'AAPL',
            type: 'stock',
            amount: 10,
            purchasePrice: 150,
            currentPrice: 160,
            purchaseDate: new Date('2023-01-15'),
          },
          {
            id: 2,
            name: 'Bitcoin',
            ticker: 'BTC',
            type: 'crypto',
            amount: 1,
            purchasePrice: 20000,
            purchaseDate: new Date('2023-01-20'),
          },
          {
            id: 3,
            name: 'Future Stock',
            ticker: 'FUT',
            type: 'stock',
            amount: 10,
            purchasePrice: 100,
            purchaseDate: new Date('2023-02-01'), // After end date
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      mockHttpService.get.mockImplementation((url, config) => {
        if (url.endsWith('/budget')) return of(mockBudgets);
        if (url.endsWith('/transaction')) return of(mockTransactions);
        if (url.endsWith('/investment')) return of(mockInvestments);
        return of({});
      });

      const result = await service.getAnalytics(start, end);

      expect(result.analytics).toHaveLength(1);
      expect(result.analytics[0].category).toBe('Food');
      expect(result.analytics[0].percentage).toBe(0.3); // (50+100)/500
      expect(result.analytics[0].transactions).toHaveLength(2);

      expect(result.investments).toHaveLength(2); // stock and crypto
      const stockGroup = result.investments.find((i) => i.type === 'stock');
      const cryptoGroup = result.investments.find((i) => i.type === 'crypto');

      expect(stockGroup?.investments).toHaveLength(1); // Future Stock filtered out
      expect(stockGroup?.totalBalance).toBe(1600); // 10 * 160

      expect(cryptoGroup?.totalBalance).toBe(20000); // 1 * 20000 (purchasePrice since currentPrice is null)
    });

    it('should throw HttpException when http call fails', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          response: {
            data: 'Error message',
            status: 400,
          },
        })),
      );

      await expect(service.getAnalytics(start, end)).rejects.toThrow();
    });

    it('should use default dates if not provided', async () => {
      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getAnalytics();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/budget'),
        expect.objectContaining({
          params: expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
          }),
        }),
      );
    });
  });
});
