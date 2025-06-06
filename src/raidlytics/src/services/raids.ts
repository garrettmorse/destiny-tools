import type { APIResponse, Raids } from "./services";
export const fetchRaids = async (): Promise<APIResponse<Raids>> => {
  try {
    // @ts-expect-error cant figure out typing globalThis specifically for local dev with vite
    const response = await fetch(`${global.SERVICE_URL}/api/d2/raids`)
    if (!response.ok) {
      throw new Error('Failed to fetch raids');
    }
    return [null, (await response.json()) as Raids];
  } catch (err) {
    console.error('Error fetching stats:', err);
    return [err as Error, null];
  }
}