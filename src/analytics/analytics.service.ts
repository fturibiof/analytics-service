import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as moment from 'moment';
import {
  SpanStatusCode,
  trace,
  context,
  propagation,
} from '@opentelemetry/api';

interface Transaction {
  id: number;
  category: string;
  amount: number;
  date: Date;
  description: string;
}

interface Budget {
  id: number;
  category: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}
  SERVICE: string = AnalyticsService.name;

  async getAnalytics(
    start?: Date,
    end?: Date,
  ): Promise<
    {
      category: string;
      budget: number;
      transactions: Transaction[];
      percentage: number;
    }[]
  > {
    if (!start)
      start = new Date(moment().startOf('month').format('YYYY-MM-DD'));
    if (!end) end = new Date(moment().endOf('month').format('YYYY-MM-DD'));
    const tracer = trace.getTracer('analytics-service');
    const span = tracer.startSpan('call-finance-service');
    context.with(trace.setSpan(context.active(), span), () => {
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);
    });
    try {
      const url = process.env.URL;
      const params = { start, end };
      this.logger.log(
        `Getting analytics from ${start.toString()} to ${end.toString()}`,
        this.SERVICE,
      );
      const [budget, transactions] = await Promise.all([
        firstValueFrom(
          this.httpService.get<Budget[]>(url + '/budget', { params }),
        ),
        firstValueFrom(
          this.httpService.get<Transaction[]>(url + '/transaction', { params }),
        ),
      ]);
      span.setStatus({ code: SpanStatusCode.OK });
      const groupedByCategory = budget.data.map((b: Budget) => ({
        category: b.category,
        budget: b.amount,
        transactions: [
          ...transactions.data.filter(
            (t: Transaction) => t.category === b.category,
          ),
        ],
        percentage:
          b.amount > 0
            ? transactions.data
                .filter((t: Transaction) => t.category === b.category)
                .reduce((acc, cur) => (acc += cur.amount), 0) / b.amount
            : 0,
      }));
      return groupedByCategory;
    } catch (error) {
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      span.setStatus({ code: SpanStatusCode.ERROR, message: error });
      throw new HttpException(
        //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.response?.data || 'Failed to fetch data',
        //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      span.end();
    }
  }
}
