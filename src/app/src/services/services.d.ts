interface UserStats {
  name: string;
  attempts: number;
  totalKills: number;
  totalDeaths: number;
  killDeathRatio: number;
  weaponKills: Record<string, number>;
  weaponKillsByAmmoType: Record<"Primary" | "Special" | "Heavy", UserStats['weaponKills']>;
  emblemIconUrl: string;
  emblemFullUrl: string;
}


interface Stats {
  user: UserStats;
  fireteam: Record<string, UserStats>;
}

interface Raids {
  [raidName: string]: {
    ids: string[];
    imgUrl: string;
  }
}

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

// declare global {
//   var SERVICE_URL: string;
// }