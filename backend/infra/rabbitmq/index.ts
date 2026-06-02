import amqp, { type Channel, type ChannelModel } from "amqplib";

export class RabbitMQClient {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  async connect() {
    if (this.channel) return this.channel;

    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();

    return this.channel;
  }

  async getChannel() {
    if (!this.channel) return this.connect();
    return this.channel;
  }
}

export const rabbitMQClient = new RabbitMQClient();