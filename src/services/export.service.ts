import { IPO, MoneyTransaction, Repayment } from '../models';
import { serializeIpo } from './ipo.service';
import { serializeMoney } from './money.service';
import { toCsv } from '../utils/csv';
import { paiseToRupees } from '../utils/money';

const IPO_COLUMNS = [
  'ipoName',
  'companyName',
  'appliedDate',
  'dematName',
  'applicationAmount',
  'lotSize',
  'lotsApplied',
  'sharesApplied',
  'applicationPrice',
  'status',
  'allottedShares',
  'allotmentPrice',
  'listingDate',
  'listingPrice',
  'currentPrice',
  'actualInvestment',
  'listingValue',
  'listingProfitLoss',
  'listingProfitPercentage',
  'currentValue',
  'currentProfitLoss',
  'currentProfitPercentage',
  'createdBy',
  'createdAt',
];

const MONEY_COLUMNS = [
  'personName',
  'personPhone',
  'type',
  'amount',
  'transactionDate',
  'dueDate',
  'reason',
  'totalPaid',
  'remainingAmount',
  'status',
  'createdBy',
  'createdAt',
];

const REPAYMENT_COLUMNS = ['moneyTransactionId', 'amount', 'paymentDate', 'notes', 'createdBy', 'createdAt'];

export async function exportIposCsv(): Promise<string> {
  const docs = await IPO.find({}).sort({ appliedDate: -1 });
  const rows = docs.map(serializeIpo);
  return toCsv(rows, IPO_COLUMNS);
}

export async function exportMoneyCsv(): Promise<string> {
  const docs = await MoneyTransaction.find({}).sort({ transactionDate: -1 });
  const rows = await Promise.all(docs.map(serializeMoney));
  return toCsv(rows, MONEY_COLUMNS);
}

export async function exportRepaymentsCsv(): Promise<string> {
  const docs = await Repayment.find({}).sort({ paymentDate: -1 });
  const rows = docs.map((r) => ({
    moneyTransactionId: r.moneyTransactionId.toString(),
    amount: paiseToRupees(r.amount),
    paymentDate: r.paymentDate,
    notes: r.notes,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
  }));
  return toCsv(rows, REPAYMENT_COLUMNS);
}

export async function exportCompleteCsv(): Promise<{ ipos: string; money: string; repayments: string }> {
  const [ipos, money, repayments] = await Promise.all([
    exportIposCsv(),
    exportMoneyCsv(),
    exportRepaymentsCsv(),
  ]);
  return { ipos, money, repayments };
}
