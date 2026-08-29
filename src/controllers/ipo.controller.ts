import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import * as ipoService from "../services/ipo.service";
import { recordAudit } from "../services/audit.service";

export const getIpos = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as any;
  const result = await ipoService.listIpos({
    search: q.search,
    status: q.status,
    dematName: q.dematName,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    year: q.year,
    month: q.month,
    sort: q.sort,
    page: q.page,
    limit: q.limit,
  });

  sendSuccess(res, result.items, "IPOs fetched successfully", 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
  
});

export const getIpo = asyncHandler(async (req: Request, res: Response) => {
  const ipo = await ipoService.getIpoById(req.params.id);
  sendSuccess(res, ipo, "IPO fetched successfully");

});

export const createIpo = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log("========== CREATE IPO START ==========");
    console.log("REQUEST BODY:", req.body);
    console.log("USER:", req.user?.name);

    const ipo = await ipoService.createIpo(req.body, req.user!.name);

    console.log("IPO CREATED:", ipo);

    await recordAudit({
      userName: req.user!.name,
      action: "CREATE_IPO",
      entityType: "IPO",
      entityId: ipo.id,
      metadata: {
        ipoName: ipo.ipoName,
      },
    });

    console.log("AUDIT CREATED");

    sendSuccess(res, ipo, "IPO created successfully", 201);
  } catch (error) {
    console.error("========== CREATE IPO ERROR ==========");
    console.error(error);
    console.error("MESSAGE:", error instanceof Error ? error.message : error);
    console.error("STACK:", error instanceof Error ? error.stack : "NO STACK");
    console.error("======================================");

    throw error;
  }
});

export const updateIpo = asyncHandler(async (req: Request, res: Response) => {
  const ipo = await ipoService.updateIpo(req.params.id, req.body);

  await recordAudit({
    userName: req.user!.name,
    action: "UPDATE_IPO",
    entityType: "IPO",
    entityId: ipo.id,
  });

  sendSuccess(res, ipo, "IPO updated successfully");
});

export const deleteIpo = asyncHandler(async (req: Request, res: Response) => {
  const result = await ipoService.deleteIpo(req.params.id, req.user!.name);

  await recordAudit({
    userName: req.user!.name,
    action: "DELETE_IPO",
    entityType: "IPO",
    entityId: result.id,
  });

  sendSuccess(res, result, "IPO deleted successfully");
});
