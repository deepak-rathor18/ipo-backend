import { Repayment, IRepayment } from '../models';
import { AppUser } from '../constants';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES } from '../constants';
import { paiseToRupees, rupeesToPaise, subtractPaise } from '../utils/money';
import { getMoneyDocOrThrow, getTotalPaidPaise } from './money.service';
import { CreateRepaymentInput, UpdateRepaymentInput } from '../validators/repayment.validator';

function serializeRepayment(r: IRepayment) {
  return {
    id: r.id,
    moneyTransactionId: r.moneyTransactionId.toString(),
    amount: paiseToRupees(r.amount),
    paymentDate: r.paymentDate,
    notes: r.notes,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function listRepayments(moneyTransactionId: string) {
  await getMoneyDocOrThrow(moneyTransactionId); // 404s if the parent doesn't exist
  const docs = await Repayment.find({ moneyTransactionId }).sort({ paymentDate: -1 });
  return docs.map(serializeRepayment);
}

export async function createRepayment(
  moneyTransactionId: string,
  input: CreateRepaymentInput,
  createdBy: AppUser
) {
  const tx = await getMoneyDocOrThrow(moneyTransactionId);

  const amountPaise = rupeesToPaise(input.amount);
  const totalPaidPaise = await getTotalPaidPaise(moneyTransactionId);
  const remainingPaise = subtractPaise(tx.amount, totalPaidPaise);

  if (amountPaise > remainingPaise) {
    throw ApiError.badRequest(
      `Repayment amount cannot exceed remaining amount of ${paiseToRupees(remainingPaise)}`,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const doc = await Repayment.create({
    moneyTransactionId,
    amount: amountPaise,
    paymentDate: input.paymentDate,
    notes: input.notes,
    createdBy,
  });

  return serializeRepayment(doc);
}

async function getRepaymentOrThrow(id: string): Promise<IRepayment> {
  const repayment = await Repayment.findById(id);
  if (!repayment) {
    throw ApiError.notFound('Repayment not found', ERROR_CODES.NOT_FOUND);
  }
  return repayment;
}

export async function updateRepayment(id: string, input: UpdateRepaymentInput) {
  const repayment = await getRepaymentOrThrow(id);
  const tx = await getMoneyDocOrThrow(repayment.moneyTransactionId.toString());

  if (input.amount !== undefined) {
    const newAmountPaise = rupeesToPaise(input.amount);

    // Total paid excluding this repayment's current amount, then re-check.
    const totalPaidPaise = await getTotalPaidPaise(tx.id);
    const totalPaidExcludingThis = subtractPaise(totalPaidPaise, repayment.amount);
    const remainingAfterExclusion = subtractPaise(tx.amount, totalPaidExcludingThis);

    if (newAmountPaise > remainingAfterExclusion) {
      throw ApiError.badRequest(
        `Repayment amount cannot exceed remaining amount of ${paiseToRupees(remainingAfterExclusion)}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    repayment.amount = newAmountPaise;
  }

  if (input.paymentDate !== undefined) repayment.paymentDate = input.paymentDate;
  if (input.notes !== undefined) repayment.notes = input.notes;

  await repayment.save();
  return serializeRepayment(repayment);
}

export async function deleteRepayment(id: string) {
  const repayment = await getRepaymentOrThrow(id);
  await repayment.deleteOne();
  return { id: repayment.id };
}
