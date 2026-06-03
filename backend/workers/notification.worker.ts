import { rabbitMQClient } from "@flow/infra/rabbitmq";
import { connectRedis } from "@flow/infra/redis";
import { getIO } from "@flow/infra/socket";

async function start() {
  await connectRedis();

  console.log("[NotificationWorker] Inicializando...");

  const io = getIO();

  const channel = await rabbitMQClient.connect();

  console.log("[NotificationWorker] Conectado ao RabbitMQ");

  await channel?.assertQueue("notification.created");

  channel?.consume("notification.created", async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());

      console.log(
        `[NotificationWorker] Recebida notificação: ${payload.id}`
      );

      if (payload.userId) {
        io.to(payload.userId).emit("notification", payload);
      } else {
        io.emit("notification", payload);
      }

      channel.ack(msg);

      console.log(
        `[NotificationWorker] Notificação ${payload.id} processada com sucesso`
      );
    } catch (error) {
      console.error(
        "[NotificationWorker] Erro ao processar notificação:",
        error
      );

      channel.nack(msg, false, true);
    }
  }
  );
}

start();