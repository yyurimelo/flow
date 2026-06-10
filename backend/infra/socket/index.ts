import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server as HttpServer } from "http";
import { pubClient, subClient } from "../redis";

let io: Server;

export async function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    const userId = socket.handshake.query.userId as string;
    if (userId) socket.join(userId);
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io não inicializado");
  return io;
}

export async function setupRedisSocketForwarder() {
  await subClient.subscribe("socket:notifications", (message) => {
    try {
      const payload = JSON.parse(message);
      const io = getIO();

      if (payload.destination === "SYSTEM" || !payload.receiverId) {
        io.emit("notification", payload);
      } else {
        io.to(payload.receiverId).emit("notification", payload);
      }

      console.log(`[RedisForwarder] Notificação ${payload.id} emitida via Socket.IO`);
    } catch (err) {
      console.error("[RedisForwarder] Erro ao emitir:", err);
    }
  });
}

