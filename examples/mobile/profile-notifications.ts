import { SmartFabricationClient } from '../../src/contracts/client';
import { identitySchema, notificationSchema } from '../../src/contracts/identity';
import type { paths } from '../../src/contracts/generated-api';

type Identity = paths['/me']['get']['responses'][200]['content']['application/json']['data'];
type Notifications = paths['/notifications']['get']['responses'][200]['content']['application/json']['data'];

/** Supply a current token from the platform's Supabase session; never embed a private key. */
export function mobileApi(baseUrl: string, accessToken: () => Promise<string | undefined>) {
  return new SmartFabricationClient(baseUrl, accessToken);
}

export async function loadProfileAndNotificationPage(client: SmartFabricationClient, cursor?: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: '25' }); if (cursor) query.set('cursor', cursor);
  const [profile, notifications] = await Promise.all([
    client.request<Identity>('/me', { signal }),
    client.request<Notifications>('/notifications?' + query.toString(), { signal }),
  ]);
  return {
    profile: identitySchema.parse(profile.data),
    notifications: notificationSchema.array().parse(notifications.data),
    nextCursor: notifications.meta.nextCursor ?? null,
  };
}
