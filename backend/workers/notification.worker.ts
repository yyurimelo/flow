import { rabbitMQClient } from "@flow/infra/rabbitmq";
import { connectRedis, pubClient } from "@flow/infra/redis";

async function start() {
  await connectRedis();

  console.log("[NotificationWorker] Inicializando...");
  const channel = await rabbitMQClient.connect();
  await channel?.assertQueue("notification.created");

  channel?.consume("notification.created", async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      console.log(`[NotificationWorker] Recebida notificação: ${payload.id}`);

      await pubClient.publish(
        "socket:notifications",
        JSON.stringify(payload)
      );

      channel.ack(msg);
      console.log(`[NotificationWorker] Notificação ${payload.id} publicada no Redis`);
    } catch (error) {
      console.error("[NotificationWorker] Erro:", error);
      channel.nack(msg, false, true);
    }
  });
}

start();