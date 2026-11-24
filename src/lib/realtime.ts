import Pusher from "pusher";
import { getServerEnv } from "./env";

export interface RealtimePublisher {
  publish(event: string, data: unknown): Promise<void>;
}
class NoopPublisher implements RealtimePublisher {
  async publish(): Promise<void> {}
}
class PusherPublisher implements RealtimePublisher {
  constructor(private readonly client: Pusher) {}
  async publish(event: string, data: unknown): Promise<void> {
    await this.client.trigger("radio-publica", event, data);
  }
}
export function createRealtimePublisher(): RealtimePublisher {
  const env = getServerEnv();
  if (!env.PUSHER_APP_ID || !env.PUSHER_KEY || !env.PUSHER_SECRET || !env.PUSHER_CLUSTER)
    return new NoopPublisher();
  return new PusherPublisher(
    new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    }),
  );
}
