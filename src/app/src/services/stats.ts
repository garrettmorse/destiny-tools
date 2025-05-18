export const fetchStats = async (userId: string, raidIds: string[]): Promise<APIResponse<Stats>> => {
  try {
    const response = await fetch(`${global.SERVICE_URL}/api/d2/aggregateRaids?userId=${encodeURIComponent(userId)}&raidIds=${encodeURIComponent(raidIds.join(','))}`)
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return [null, (await response.json()) as Stats];
  } catch (err) {
    console.error('Error fetching stats:', err);
    return [err as Error, null];
  }
};