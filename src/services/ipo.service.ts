import { FilterQuery } from "mongoose";
import { IPO, IIPO } from "../models";
import { AppUser } from "../constants";
import { ApiError } from "../utils/ApiError";
import { ERROR_CODES } from "../constants";
import {
  paiseToRupees,
  rupeesToPaise,
  multiplyPaise,
  subtractPaise,
  percentage,
} from "../utils/money";
import { CreateIpoInput, UpdateIpoInput } from "../validators/ipo.validator";
import { PaginatedResult } from "../types";

export interface IpoListFilters {
  search?: string;
  status?: string;
  dematName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  year?: number;
  month?: number;
  sort?: string;
  page: number;
  limit: number;
}

/** Computed, backend-authoritative financial fields for API responses. */
export interface IpoWithCalculations {
  actualInvestment: number;
  listingValue: number;
  listingProfitLoss: number;
  listingProfitPercentage: number;
  currentValue: number;
  currentProfitLoss: number;
  currentProfitPercentage: number;
}

function toRupeeAmounts(ipo: any) {
  return {
    ...ipo,

    applicationAmount:
      ipo.applicationAmount === null || ipo.applicationAmount === undefined
        ? null
        : paiseToRupees(ipo.applicationAmount),

    applicationPrice:
      ipo.applicationPrice === null || ipo.applicationPrice === undefined
        ? null
        : paiseToRupees(ipo.applicationPrice),

    allotmentPrice:
      ipo.allotmentPrice === null || ipo.allotmentPrice === undefined
        ? null
        : paiseToRupees(ipo.allotmentPrice),

    listingPrice:
      ipo.listingPrice === null || ipo.listingPrice === undefined
        ? null
        : paiseToRupees(ipo.listingPrice),

    currentPrice:
      ipo.currentPrice === null || ipo.currentPrice === undefined
        ? null
        : paiseToRupees(ipo.currentPrice),
  };
}

/**
 * Backend is the single source of truth for all IPO financial calculations.
 * Frontend-supplied computed values are never trusted or persisted.
 */
export function calculateIpoFinancials(ipo: IIPO): IpoWithCalculations {
  const allottedShares = ipo.allottedShares || 0;

  // actualInvestment: what was actually put in for the shares allotted.
  const actualInvestmentPaise = multiplyPaise(
    ipo.allotmentPrice,
    allottedShares,
  );

  const listingValuePaise = multiplyPaise(ipo.listingPrice, allottedShares);
  const listingProfitLossPaise = subtractPaise(
    listingValuePaise,
    actualInvestmentPaise,
  );
  const listingProfitPercentage = percentage(
    listingProfitLossPaise,
    actualInvestmentPaise,
  );

  const currentValuePaise = multiplyPaise(ipo.currentPrice, allottedShares);
  const currentProfitLossPaise = subtractPaise(
    currentValuePaise,
    actualInvestmentPaise,
  );
  const currentProfitPercentage = percentage(
    currentProfitLossPaise,
    actualInvestmentPaise,
  );

  return {
    actualInvestment: paiseToRupees(actualInvestmentPaise),
    listingValue: paiseToRupees(listingValuePaise),
    listingProfitLoss: paiseToRupees(listingProfitLossPaise),
    listingProfitPercentage,
    currentValue: paiseToRupees(currentValuePaise),
    currentProfitLoss: paiseToRupees(currentProfitLossPaise),
    currentProfitPercentage,
  };
}

export function serializeIpo(ipo: IIPO) {
  const calc = calculateIpoFinancials(ipo);
  const amounts = toRupeeAmounts(ipo);

  return {
    id: ipo.id,
    ipoName: ipo.ipoName,
    companyName: ipo.companyName,
    appliedDate: ipo.appliedDate,
    dematName: ipo.dematName,
    applicationAmount: amounts.applicationAmount,
    lotSize: ipo.lotSize,
    lotsApplied: ipo.lotsApplied,
    sharesApplied: ipo.sharesApplied,
    applicationPrice: amounts.applicationPrice,
    status: ipo.status,
    allottedShares: ipo.allottedShares,
    allotmentPrice: amounts.allotmentPrice,
    listingDate: ipo.listingDate,
    listingPrice: amounts.listingPrice,
    currentPrice: amounts.currentPrice,
    notes: ipo.notes,
    createdBy: ipo.createdBy,
    createdAt: ipo.createdAt,
    updatedAt: ipo.updatedAt,
    ...calc,
  };
}

function buildDateFilter(filters: IpoListFilters): FilterQuery<IIPO> {
  const query: FilterQuery<IIPO> = {};

  if (filters.dateFrom || filters.dateTo) {
    query.appliedDate = {};
    if (filters.dateFrom) (query.appliedDate as any).$gte = filters.dateFrom;
    if (filters.dateTo) (query.appliedDate as any).$lte = filters.dateTo;
  }

  if (filters.year) {
    const start = new Date(
      Date.UTC(filters.year, filters.month ? filters.month - 1 : 0, 1),
    );
    const end = filters.month
      ? new Date(Date.UTC(filters.year, filters.month, 1))
      : new Date(Date.UTC(filters.year + 1, 0, 1));
    query.appliedDate = { $gte: start, $lt: end };
  }

  return query;
}

export function buildIpoQuery(filters: IpoListFilters): FilterQuery<IIPO> {
  const query: FilterQuery<IIPO> = { ...buildDateFilter(filters) };

  if (filters.search) {
    query.$or = [
      { ipoName: { $regex: filters.search, $options: "i" } },
      { companyName: { $regex: filters.search, $options: "i" } },
    ];
  }

  // if (filters.status) query.status = filters.status;
  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status;
  }
  if (filters.dematName)
    query.dematName = { $regex: `^${filters.dematName}$`, $options: "i" };

  return query;
}

export async function listIpos(
  filters: IpoListFilters,
): Promise<PaginatedResult<ReturnType<typeof serializeIpo>>> {
  const query = buildIpoQuery(filters);

  const sortField = filters.sort?.replace(/^-/, "") || "appliedDate";
  const sortDir = filters.sort?.startsWith("-") || !filters.sort ? -1 : 1;

  const skip = (filters.page - 1) * filters.limit;

  const [docs, total] = await Promise.all([
    IPO.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(filters.limit),
    IPO.countDocuments(query),
  ]);

  return {
    items: docs.map(serializeIpo),
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
  };
}

export async function getIpoById(id: string) {
  const ipo = await IPO.findById(id);
  if (!ipo) {
    throw ApiError.notFound("IPO record not found", ERROR_CODES.NOT_FOUND);
  }
  return serializeIpo(ipo);
}

function toPaiseFields(input: Partial<CreateIpoInput | UpdateIpoInput>) {
  const out: Record<string, number | null> = {};

  if (input.applicationAmount !== undefined) {
    out.applicationAmount = rupeesToPaise(input.applicationAmount);
  }

  if (input.applicationPrice !== undefined) {
    out.applicationPrice = rupeesToPaise(input.applicationPrice);
  }

  if (input.allotmentPrice !== undefined) {
    out.allotmentPrice =
      input.allotmentPrice === null
        ? null
        : rupeesToPaise(input.allotmentPrice);
  }

  if (input.listingPrice !== undefined) {
    out.listingPrice =
      input.listingPrice === null ? null : rupeesToPaise(input.listingPrice);
  }

  if (input.currentPrice !== undefined) {
    out.currentPrice =
      input.currentPrice === null ? null : rupeesToPaise(input.currentPrice);
  }

  return out;
}

export async function createIpo(input: CreateIpoInput, createdBy: AppUser) {
  const doc = await IPO.create({
    ...input,
    ...toPaiseFields(input),
    createdBy,
  });
  return serializeIpo(doc);
}

export async function updateIpo(id: string, input: UpdateIpoInput) {
  const ipo = await IPO.findById(id);
  if (!ipo) {
    throw ApiError.notFound("IPO record not found", ERROR_CODES.NOT_FOUND);
  }

  Object.assign(ipo, { ...input, ...toPaiseFields(input) });
  await ipo.save();

  return serializeIpo(ipo);
}

export async function deleteIpo(id: string, deletedBy: AppUser) {
  const ipo = await IPO.findById(id);
  if (!ipo) {
    throw ApiError.notFound("IPO record not found", ERROR_CODES.NOT_FOUND);
  }

  ipo.isDeleted = true;
  ipo.deletedAt = new Date();
  ipo.deletedBy = deletedBy;
  await ipo.save();

  return { id: ipo.id };
}
