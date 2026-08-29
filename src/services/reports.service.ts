import { IPO, MoneyTransaction } from '../models';
import { buildIpoQuery, serializeIpo, IpoListFilters } from './ipo.service';
import { buildMoneyQuery, serializeMoney, MoneyListFilters } from './money.service';

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  year?: number;
  month?: number;
  dematName?: string;
  status?: string;
}

export async function getIpoReport(filters: ReportFilters) {
  const query = buildIpoQuery({
    ...filters,
    page: 1,
    limit: Number.MAX_SAFE_INTEGER,
  } as IpoListFilters);

  const docs = await IPO.find(query).sort({ appliedDate: -1 });
  const items = docs.map(serializeIpo);

  const totals = items.reduce(
    (acc, ipo) => {
      acc.applicationAmount += ipo.applicationAmount;
      acc.actualInvestment += ipo.actualInvestment;
      acc.listingProfitLoss += ipo.listingProfitLoss;
      acc.currentProfitLoss += ipo.currentProfitLoss;
      return acc;
    },
    { applicationAmount: 0, actualInvestment: 0, listingProfitLoss: 0, currentProfitLoss: 0 }
  );

  return { items, count: items.length, totals };
}

export async function getMoneyReport(filters: ReportFilters) {
  const query = buildMoneyQuery({
    ...filters,
    page: 1,
    limit: Number.MAX_SAFE_INTEGER,
  } as MoneyListFilters);

  const docs = await MoneyTransaction.find(query).sort({ transactionDate: -1 });
  const items = await Promise.all(docs.map(serializeMoney));

  const totals = items.reduce(
    (acc, tx) => {
      if (tx.type === 'GIVEN') acc.totalGiven += tx.amount;
      else acc.totalBorrowed += tx.amount;
      acc.totalPaid += tx.totalPaid;
      acc.totalRemaining += tx.remainingAmount;
      return acc;
    },
    { totalGiven: 0, totalBorrowed: 0, totalPaid: 0, totalRemaining: 0 }
  );

  return { items, count: items.length, totals };
}

export async function getCombinedReport(filters: ReportFilters) {
  const [ipoReport, moneyReport] = await Promise.all([getIpoReport(filters), getMoneyReport(filters)]);

  return {
    ipo: ipoReport,
    money: moneyReport,
  };
}
