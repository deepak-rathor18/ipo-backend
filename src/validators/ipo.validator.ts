import { z } from "zod";
import { IPO_STATUS } from "../constants";
import {
  dateRangeSchema,
  paginationSchema,
  rupeeAmountSchema,
} from "./common.validator";

const baseIpoFields = {
  ipoName: z.string().trim().min(1, "ipoName is required"),

  companyName: z.string().trim().min(1, "companyName is required"),

  appliedDate: z.coerce.date({
    required_error: "appliedDate is required",
  }),

  dematName: z.string().trim().min(1, "dematName is required"),

  applicationAmount: rupeeAmountSchema,

  lotSize: z.number().int().positive("lotSize must be a positive integer"),

  lotsApplied: z
    .number()
    .int()
    .positive("lotsApplied must be a positive integer"),

  sharesApplied: z
    .number()
    .int()
    .positive("sharesApplied must be a positive integer"),

  applicationPrice: rupeeAmountSchema,

  status: z.enum(IPO_STATUS).default("APPLIED"),

  allottedShares: z.number().int().nonnegative().nullable().default(0),

  allotmentPrice: rupeeAmountSchema.nullable().default(0),

  listingDate: z.coerce.date().nullable().optional(),

  listingPrice: rupeeAmountSchema.nullable().default(0),

  currentPrice: rupeeAmountSchema.nullable().default(0),

  notes: z.string().trim().nullable().default(""),
};

export const createIpoSchema = z.object({
  body: z.object(baseIpoFields).superRefine((data, ctx) => {
    if (
      data.status === "ALLOTTED" &&
      (!data.allottedShares || data.allottedShares <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "allottedShares must be greater than 0 when status is ALLOTTED",
        path: ["allottedShares"],
      });
    }
  }),
});

export const updateIpoSchema = z.object({
  body: z
    .object(baseIpoFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

export const listIposQuerySchema = z.object({
  query: paginationSchema.merge(dateRangeSchema).extend({
    search: z.string().trim().optional(),
    // status: z.enum(IPO_STATUS).optional(),
    status: z.enum(["ALL", ...IPO_STATUS]).optional(),
    dematName: z.string().trim().optional(),
    sort: z.string().optional(),
  }),
});

export type CreateIpoInput = z.infer<typeof createIpoSchema>["body"];
export type UpdateIpoInput = z.infer<typeof updateIpoSchema>["body"];
