import "../env";
import { createClient } from "redis";

export const pubClient = createClient({ url: process.env.REDIS_URL! });
export const subClient = pubClient.duplicate();

pubClient.on("error", (err) => console.error("[Redis pub]", err));
subClient.on("error", (err) => console.error("[Redis sub]", err));

export async function connectRedis() {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log("[Redis] Conectado");
}