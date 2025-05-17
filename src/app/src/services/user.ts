interface DestinyPlayer {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
  displayName: string;
  crossSaveOverride: 1 | 2 | 3 | 4;
  iconPath: string;
  isPublic: boolean;
  membershipId: string;
  membershipType:  1 | 2 | 3 | 4;
}

interface UserResult {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
  bungieNetMembershipId: string;
  destinyMemberships: DestinyPlayer[];
}

type APIResponse<T> = [Error, null] | [null, T];

export const fetchUser = async (userName: string): Promise<APIResponse<UserResult[]>> => {
  try {
    const response = await fetch(`http://localhost:8080/api/d2/searchUser?user=${encodeURIComponent(userName)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }
    return [null, (await response.json()) as UserResult[]];
  } catch (err) {
    console.error('Error fetching search results:', err);
    return [err as Error, null];
  }
}