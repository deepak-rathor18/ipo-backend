import { MoneyTransaction, Repayment } from '../models';
import { paiseToRupees } from '../utils/money';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES } from '../constants';

interface PersonTotals {
  personName: string;
  totalGiven: number;
  totalBorrowed: number;
  totalReceived: number;
  totalPaid: number;
  remainingAmount: number; // net remaining across all their transactions
}

async function computeTotalsForPersons(personNames: string[]): Promise<PersonTotals[]> {
  const transactions = await MoneyTransaction.find({ personName: { $in: personNames } });

  const txIds = transactions.map((t) => t.id);
  const repayments = await Repayment.find({ moneyTransactionId: { $in: txIds } });

  const paidByTx = new Map<string, number>();
  for (const r of repayments) {
    const key = r.moneyTransactionId.toString();
    paidByTx.set(key, (paidByTx.get(key) ?? 0) + r.amount);
  }

  const totalsByPerson = new Map<string, PersonTotals>();

  for (const name of personNames) {
    totalsByPerson.set(name, {
      personName: name,
      totalGiven: 0,
      totalBorrowed: 0,
      totalReceived: 0,
      totalPaid: 0,
      remainingAmount: 0,
    });
  }

  let netRemainingPaise = new Map<string, number>();
  personNames.forEach((n) => netRemainingPaise.set(n, 0));

  for (const tx of transactions) {
    const totals = totalsByPerson.get(tx.personName);
    if (!totals) continue;

    const paidPaise = paidByTx.get(tx.id) ?? 0;
    const remainingPaise = Math.max(0, tx.amount - paidPaise);

    if (tx.type === 'GIVEN') {
      totals.totalGiven += paiseToRupees(tx.amount);
      totals.totalReceived += paiseToRupees(paidPaise);
      // Money given out and not yet received back increases what's owed to us.
      netRemainingPaise.set(tx.personName, (netRemainingPaise.get(tx.personName) ?? 0) + remainingPaise);
    } else {
      totals.totalBorrowed += paiseToRupees(tx.amount);
      totals.totalPaid += paiseToRupees(paidPaise);
      // Money borrowed and not yet paid back decreases the net (we owe them).
      netRemainingPaise.set(tx.personName, (netRemainingPaise.get(tx.personName) ?? 0) - remainingPaise);
    }
  }

  for (const [name, totals] of totalsByPerson) {
    totals.remainingAmount = paiseToRupees(netRemainingPaise.get(name) ?? 0);
  }

  return Array.from(totalsByPerson.values());
}

export async function listPeople(): Promise<PersonTotals[]> {
  const distinctNames = await MoneyTransaction.distinct('personName');
  return computeTotalsForPersons(distinctNames);
}

export async function getPersonSummary(name: string): Promise<PersonTotals> {
  const distinctNames = await MoneyTransaction.distinct('personName', {
    personName: { $regex: `^${name}$`, $options: 'i' },
  });

  if (distinctNames.length === 0) {
    throw ApiError.notFound('No records found for this person', ERROR_CODES.NOT_FOUND);
  }

  const results = await computeTotalsForPersons(distinctNames);
  return results[0];
}
