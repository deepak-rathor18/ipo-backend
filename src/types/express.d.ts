import { AppUser } from "../constants";

declare global {
  namespace Express {
    interface Request {
      user?: {
        name: AppUser;
      };
    }
  }
}

export {};
