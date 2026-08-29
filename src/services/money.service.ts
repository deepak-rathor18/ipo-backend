import { FilterQuery, Types } from "mongoose";
import { MoneyTransaction, IMoneyTransaction, Repayment } from "../models";
import { AppUser, MoneyStatus } from "../constants";
import { ApiError } from "../utils/ApiError";
import { ERROR_CODES } from "../constants";
import {
  paiseToRupees,
  rupeesToPaise,
  addPaise,
  subtractPaise,
} from "../utils/money";
import {
  CreateMoneyInput,
  UpdateMoneyInput,
} from "../validators/money.validator";
import { PaginatedResult } from "../types";

export interface MoneyListFilters {
  search?: string;
  type?: string;
  status?: string;
  personName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  year?: number;
  month?: number;
  sort?: string;
  page: number;
  limit: number;
}

export interface MoneyTotals {
  totalPaid: number; // rupees
  remainingAmount: number; // rupees
  status: MoneyStatus;
}

/** Sum of all repayments (in paise) recorded against a transaction. */
export async function getTotalPaidPaise(
  moneyTransactionId: string,
): Promise<number> {
  const result = await Repayment.aggregate<{ _id: null; total: number }>([
    { $match: { moneyTransactionId: new Types.ObjectId(moneyTransactionId) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total ?? 0;
}

export function computeStatus(
  remainingPaise: number,
  totalPaidPaise: number,
  dueDate: Date | null,
): MoneyStatus {
  if (remainingPaise <= 0) return "PAID";
  if (dueDate && dueDate.getTime() < Date.now()) return "OVERDUE";
  if (totalPaidPaise > 0) return "PARTIALLY_PAID";
  return "PENDING";
}

export async function getMoneyTotals(
  tx: IMoneyTransaction,
): Promise<MoneyTotals> {
  const totalPaidPaise = await getTotalPaidPaise(tx.id);
  const remainingPaise = subtractPaise(tx.amount, totalPaidPaise);
  const status = computeStatus(remainingPaise, totalPaidPaise, tx.dueDate);

  return {
    totalPaid: paiseToRupees(totalPaidPaise),
    remainingAmount: paiseToRupees(Math.max(0, remainingPaise)),
    status,
  };
}

export async function serializeMoney(tx: IMoneyTransaction) {
  const totals = await getMoneyTotals(tx);

  return {
    id: tx.id,
    personName: tx.personName,
    personPhone: tx.personPhone,
    type: tx.type,
    amount: paiseToRupees(tx.amount),
    transactionDate: tx.transactionDate,
    dueDate: tx.dueDate,
    reason: tx.reason,
    notes: tx.notes,
    createdBy: tx.createdBy,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    ...totals,
  };
}

function buildDateFilter(
  filters: MoneyListFilters,
): FilterQuery<IMoneyTransaction> {
  const query: FilterQuery<IMoneyTransaction> = {};

  if (filters.dateFrom || filters.dateTo) {
    query.transactionDate = {};
    if (filters.dateFrom)
      (query.transactionDate as any).$gte = filters.dateFrom;
    if (filters.dateTo) (query.transactionDate as any).$lte = filters.dateTo;
  }

  if (filters.year) {
    const start = new Date(
      Date.UTC(filters.year, filters.month ? filters.month - 1 : 0, 1),
    );
    const end = filters.month
      ? new Date(Date.UTC(filters.year, filters.month, 1))
      : new Date(Date.UTC(filters.year + 1, 0, 1));
    query.transactionDate = { $gte: start, $lt: end };
  }

  return query;
}

export function buildMoneyQuery(
  filters: MoneyListFilters,
): FilterQuery<IMoneyTransaction> {
  const query: FilterQuery<IMoneyTransaction> = { ...buildDateFilter(filters) };

  if (filters.search) {
    query.$or = [
      { personName: { $regex: filters.search, $options: "i" } },
      { reason: { $regex: filters.search, $options: "i" } },
    ];
  }

  if (filters.personName)
    query.personName = { $regex: `^${filters.personName}$`, $options: "i" };


  if (filters.type && filters.type !== "ALL") {
    query.type = filters.type;
  }

  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status;
  }
  return query;
}

export async function listMoney(
  filters: MoneyListFilters,
): Promise<PaginatedResult<Awaited<ReturnType<typeof serializeMoney>>>> {
  const query = buildMoneyQuery(filters);

  const sortField = filters.sort?.replace(/^-/, "") || "transactionDate";
  const sortDir = filters.sort?.startsWith("-") || !filters.sort ? -1 : 1;

  const skip = (filters.page - 1) * filters.limit;

  const [docs, total] = await Promise.all([
    MoneyTransaction.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(filters.limit),

    MoneyTransaction.countDocuments(query),
  ]);

  let serialized = await Promise.all(docs.map(serializeMoney));

  // status is derived, so filter after serialization

  if (filters.status && filters.status !== "ALL") {
    serialized = serialized.filter((m) => m.status === filters.status);
  }

  return {
    items: serialized,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
  };
}
export async function getMoneyById(id: string) {
  const tx = await MoneyTransaction.findById(id);
  if (!tx) {
    throw ApiError.notFound(
      "Money transaction not found",
      ERROR_CODES.NOT_FOUND,
    );
  }
  return serializeMoney(tx);
}

export async function getMoneyDocOrThrow(
  id: string,
): Promise<IMoneyTransaction> {
  const tx = await MoneyTransaction.findById(id);
  if (!tx) {
    throw ApiError.notFound(
      "Money transaction not found",
      ERROR_CODES.NOT_FOUND,
    );
  }
  return tx;
}

export async function createMoney(input: CreateMoneyInput, createdBy: AppUser) {
  const doc = await MoneyTransaction.create({
    ...input,
    amount: rupeesToPaise(input.amount),
    createdBy,
  });
  return serializeMoney(doc);
}

export async function updateMoney(id: string, input: UpdateMoneyInput) {
  const tx = await getMoneyDocOrThrow(id);

  const update: Record<string, unknown> = { ...input };
  if (input.amount !== undefined) {
    const paise = rupeesToPaise(input.amount);
    const totalPaidPaise = await getTotalPaidPaise(tx.id);
    if (paise < totalPaidPaise) {
      throw ApiError.badRequest(
        "New amount cannot be less than the total already repaid",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    update.amount = paise;
  }

  Object.assign(tx, update);
  await tx.save();

  return serializeMoney(tx);
}

export async function deleteMoney(id: string, deletedBy: AppUser) {
  const tx = await getMoneyDocOrThrow(id);

  tx.isDeleted = true;
  tx.deletedAt = new Date();
  tx.deletedBy = deletedBy;
  await tx.save();

  return { id: tx.id };
}
