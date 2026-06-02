import { rabbitMQClient } from ".";

export async function publish(
  queue: string,
  payload: unknown
) {
  const channel = await rabbitMQClient.getChannel();

  await channel?.assertQueue(queue, {
    durable: true,
  });

  channel?.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
    }
  );
}