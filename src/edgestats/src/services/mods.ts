import type { APIResponse, Mods } from "./services";
export const fetchMods = async (): Promise<APIResponse<Mods>> => {
  try {
    // @ts-expect-error cant figure out typing globalThis specifically for local dev with vite
    const response = await fetch(`${global.SERVICE_URL}/api/d2/mods`)
    if (!response.ok) {
      throw new Error('Failed to fetch mods');
    }
    return [null, (await response.json()) as Mods];
  } catch (err) {
    console.error('Error fetching stats:', err);
    return [err as Error, null];
  }
}