import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as moment from "moment";

@Injectable()
export class AnalyticsService {

  constructor(private readonly httpService: HttpService) { }

  async getAnalytics(start?: Date, end?: Date): Promise<any> {
    if (!start) start = new Date(moment().startOf('month').format('YYYY-MM-DD'));
    if (!end) end = new Date(moment().endOf('month').format('YYYY-MM-DD'));
    try {
      const url = 'http://localhost:3000';
      const params = { start, end };

      const [budget, transactions] = await Promise.all([
        firstValueFrom(
          this.httpService.get(url + '/budget', { params })
        ),
        firstValueFrom(this.httpService.get(url + '/transaction', { params }))
      ]);
      console.log(`res`, budget.data, transactions.data);
      const groupedByCategory = budget.data.map(
        b => ({
          category: b.category,
          budget: b.amount,
          transactions: [...transactions.data.filter(t => t.category === b.category)],
          percentage: b.amount > 0 ? transactions.data.filter(t => t.category === b.category).reduce((acc, cur) => acc += cur.amount, 0) / b.amount : 0
        })
      );
      return groupedByCategory;
    } catch (error) {
      throw new HttpException(
        error?.response?.data || 'Failed to fetch budgets',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
