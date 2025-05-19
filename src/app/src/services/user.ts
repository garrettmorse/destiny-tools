export const fetchUser = async (userName: string): Promise<APIResponse<UserResult[]>> => {
  try {
    // @ts-expect-error cant figure out typing globalThis specifically for local dev with vite
    const response = await fetch(`${global.SERVICE_URL}/api/d2/searchUser?user=${encodeURIComponent(userName)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }
    return [null, (await response.json()) as UserResult[]];
  } catch (err) {
    console.error('Error fetching search results:', err);
    return [err as Error, null];
  }
}