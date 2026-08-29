import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  mongoose.connection.on("connected", () => {
    isConnected = true;
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("MongoDB disconnected");
  });

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: !env.NODE_ENV.includes("production"),
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
}

export function getDatabaseState(): {
  connected: boolean;
  readyState: number;
} {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  };
}
