export const APP_USERS = ['Deepak', 'Aman'] as const;
export type AppUser = (typeof APP_USERS)[number];

export const IPO_STATUS = ['APPLIED', 'ALLOTTED', 'NOT_ALLOTTED', 'CANCELLED'] as const;
export type IpoStatus = (typeof IPO_STATUS)[number];

export const MONEY_TYPE = ['GIVEN', 'BORROWED'] as const;
export type MoneyType = (typeof MONEY_TYPE)[number];

export const MONEY_STATUS = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const;
export type MoneyStatus = (typeof MONEY_STATUS)[number];

export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_IPO',
  'UPDATE_IPO',
  'DELETE_IPO',
  'CREATE_MONEY',
  'UPDATE_MONEY',
  'DELETE_MONEY',
  'ADD_REPAYMENT',
  'UPDATE_REPAYMENT',
  'DELETE_REPAYMENT',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export const PAISE_MULTIPLIER = 100;
