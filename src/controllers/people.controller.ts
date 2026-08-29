import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as peopleService from '../services/people.service';

export const getPeople = asyncHandler(async (_req: Request, res: Response) => {
  const people = await peopleService.listPeople();
  sendSuccess(res, people, 'People fetched successfully');
});

export const getPerson = asyncHandler(async (req: Request, res: Response) => {
  const person = await peopleService.getPersonSummary(req.params.name);
  sendSuccess(res, person, 'Person summary fetched successfully');
});
