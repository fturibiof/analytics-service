import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  SpanStatusCode,
  trace,
  context,
  propagation,
} from '@opentelemetry/api';
import { firstValueFrom } from 'rxjs';
import * as moment from 'moment';

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

interface Investment {
  id: number;
  name: string;
  ticker: string;
  type: string;
  amount: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: Date;
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
  ): Promise<{
    analytics: {
      category: string;
      budget: number;
      transactions: Transaction[];
      percentage: number;
    }[];
    investments: {
      type: string;
      investments: Investment[];
      totalBalance: number;
    }[];
  }> {
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
      const [budget, transactions, investments] = await Promise.all([
        firstValueFrom(
          this.httpService.get<Budget[]>(url + '/budget', { params }),
        ),
        firstValueFrom(
          this.httpService.get<Transaction[]>(url + '/transaction', { params }),
        ),
        firstValueFrom(
          this.httpService.get<Investment[]>(url + '/investment', { params }),
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

      const filteredInvestments = investments.data.filter((i) =>
        moment(i.purchaseDate).isSameOrBefore(end),
      );

      const groupedInvestments = filteredInvestments.reduce(
        (acc, inv) => {
          if (!acc[inv.type]) {
            acc[inv.type] = {
              type: inv.type,
              investments: [],
              totalBalance: 0,
            };
          }
          acc[inv.type].investments.push(inv);
          acc[inv.type].totalBalance +=
            inv.amount * (inv.currentPrice ?? inv.purchasePrice);
          return acc;
        },
        {} as Record<
          string,
          { type: string; investments: Investment[]; totalBalance: number }
        >,
      );

      return {
        analytics: groupedByCategory,
        investments: Object.values(groupedInvestments),
      };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error });
      throw new HttpException(
        error?.response?.data || 'Failed to fetch data',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      span.end();
    }
  }
}
