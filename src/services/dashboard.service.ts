import { IPO, MoneyTransaction, Repayment } from '../models';
import { paiseToRupees, addPaise, subtractPaise } from '../utils/money';
import { calculateIpoFinancials } from './ipo.service';

async function getRepaymentTotalsByTx(): Promise<Map<string, number>> {
  const totals = await Repayment.aggregate<{ _id: string; total: number }>([
    { $group: { _id: '$moneyTransactionId', total: { $sum: '$amount' } } },
  ]);
  const map = new Map<string, number>();
  for (const t of totals) map.set(t._id.toString(), t.total);
  return map;
}

export async function getIpoDashboard() {
  const ipos = await IPO.find({});

  let totalApplications = ipos.length;
  let totalApplicationAmountPaise = 0;
  let totalActualInvestmentPaise = 0;
  let totalAllotted = 0;
  let totalNotAllotted = 0;
  let totalListingPLPaise = 0;
  let totalCurrentPLPaise = 0;

  for (const ipo of ipos) {
    totalApplicationAmountPaise = addPaise(totalApplicationAmountPaise, ipo.applicationAmount);

    if (ipo.status === 'ALLOTTED') totalAllotted += 1;
    if (ipo.status === 'NOT_ALLOTTED') totalNotAllotted += 1;

    const calc = calculateIpoFinancials(ipo);
    totalActualInvestmentPaise = addPaise(totalActualInvestmentPaise, Math.round(calc.actualInvestment * 100));
    totalListingPLPaise = addPaise(totalListingPLPaise, Math.round(calc.listingProfitLoss * 100));
    totalCurrentPLPaise = addPaise(totalCurrentPLPaise, Math.round(calc.currentProfitLoss * 100));
  }

  return {
    totalApplications,
    totalApplicationAmount: paiseToRupees(totalApplicationAmountPaise),
    totalActualInvestment: paiseToRupees(totalActualInvestmentPaise),
    totalAllotted,
    totalNotAllotted,
    totalListingProfitLoss: paiseToRupees(totalListingPLPaise),
    totalCurrentProfitLoss: paiseToRupees(totalCurrentPLPaise),
  };
}

export async function getMoneyDashboard() {
  const transactions = await MoneyTransaction.find({});
  const paidByTx = await getRepaymentTotalsByTx();

  let totalGivenPaise = 0;
  let totalBorrowedPaise = 0;
  let moneyToReceivePaise = 0;
  let moneyToPayPaise = 0;
  let pendingReceivablePaise = 0;
  let pendingPayablePaise = 0;
  let overdueReceivablePaise = 0;
  let overduePayablePaise = 0;

  const now = Date.now();

  for (const tx of transactions) {
    const paidPaise = paidByTx.get(tx.id) ?? 0;
    const remainingPaise = Math.max(0, subtractPaise(tx.amount, paidPaise));
    const isOverdue = !!tx.dueDate && tx.dueDate.getTime() < now && remainingPaise > 0;

    if (tx.type === 'GIVEN') {
      totalGivenPaise = addPaise(totalGivenPaise, tx.amount);
      moneyToReceivePaise = addPaise(moneyToReceivePaise, remainingPaise);
      if (remainingPaise > 0) {
        if (isOverdue) overdueReceivablePaise = addPaise(overdueReceivablePaise, remainingPaise);
        else pendingReceivablePaise = addPaise(pendingReceivablePaise, remainingPaise);
      }
    } else {
      totalBorrowedPaise = addPaise(totalBorrowedPaise, tx.amount);
      moneyToPayPaise = addPaise(moneyToPayPaise, remainingPaise);
      if (remainingPaise > 0) {
        if (isOverdue) overduePayablePaise = addPaise(overduePayablePaise, remainingPaise);
        else pendingPayablePaise = addPaise(pendingPayablePaise, remainingPaise);
      }
    }
  }

  return {
    totalMoneyGiven: paiseToRupees(totalGivenPaise),
    totalMoneyBorrowed: paiseToRupees(totalBorrowedPaise),
    moneyToReceive: paiseToRupees(moneyToReceivePaise),
    moneyToPay: paiseToRupees(moneyToPayPaise),
    pendingReceivable: paiseToRupees(pendingReceivablePaise),
    pendingPayable: paiseToRupees(pendingPayablePaise),
    overdueReceivable: paiseToRupees(overdueReceivablePaise),
    overduePayable: paiseToRupees(overduePayablePaise),
    netBalance: paiseToRupees(subtractPaise(moneyToReceivePaise, moneyToPayPaise)),
  };
}

export async function getSummaryDashboard() {
  const [ipoStats, moneyStats] = await Promise.all([getIpoDashboard(), getMoneyDashboard()]);

  return {
    ipo: ipoStats,
    money: moneyStats,
    netBalance: moneyStats.netBalance,
  };
}
