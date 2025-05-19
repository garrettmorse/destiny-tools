import fs from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { apiClient, apiGet } from "./client.js";
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

const fileExists = async path => !!(await fs.stat(path).catch(e => false));

const MANIFEST_ENDPOINTS = /** @type {const} */ (["DestinyActivityDefinition", "DestinyInventoryItemDefinition"]);

const MANIFEST_LOCATION = __dirname + path.sep + 'content_small.json';

const DESTINY_AMMO_TYPE = /** @type {const} */ ({
  "1": "Primary",
  "2": "Special",
  "3": "Heavy"
});

/**
 * @param {string} dateIsh YYYY-MM-DD
 */
function isValidD2DayFormat(dateIsh) {
  const [year, month, day] = dateIsh.split('-');
  const dateStrShapeCondition = year.length === 4 && month.length === 2 && day.length === 2;
  const dateStrValidNumsCondition = !!Number(year) && !!Number(month) && !!Number(day);
  return dateStrShapeCondition && dateStrValidNumsCondition;
}

/**
 * @param {boolean} retry 
 * @returns {Promise<Record<DestinyManifestKey, string>>}
 */
async function fetchManifest(retry) {
  const [manifestErr, manifestData] = await apiGet('/Destiny2/Manifest');
  if (manifestErr) {
    console.error('Kaboom while retrieving D2 Manifest');
    if (retry) return fetchManifest(false);
  }
  return manifestData.Response.jsonWorldComponentContentPaths.en;
}

/**
 * @returns {Promise<DestinyManifest>} 
 */
async function fetchContent() {
  const manifestEndpointMap = await fetchManifest(true);
  let data = {};
  for (const manifestEndpoint of MANIFEST_ENDPOINTS) {
    data[manifestEndpoint] = {};
    try {
      const response = (await apiClient.get(manifestEndpointMap[manifestEndpoint])).data;
      // for items, only include items with ammo types
      if (manifestEndpoint === 'DestinyInventoryItemDefinition') {
        for (const hash in response) {
          if (response[hash]?.itemTypeDisplayName === 'Emblem') {
            data[manifestEndpoint][hash] = response[hash];
          }
          if (response[hash]?.equippingBlock?.ammoType) {
            data[manifestEndpoint][hash] = response[hash];
          }
        }
      } else {
        data[manifestEndpoint] = response;
      }
    } catch (err) {
      console.error('Kaboom while retrieving D2 Content');
      console.error(err);
    }
  }
  return data;
}

/**
 * @typedef {{ originalDisplayProperties: { name: string }; pgcrImage: string }} DestinyActivityEntry
 * 
 * @typedef {Record<string, DestinyActivityEntry>} DestinyActivityDefinition
 * 
 * @typedef {{ displayProperties: { name: string }; equippingBlock: { ammoType: keyof typeof DESTINY_AMMO_TYPE } }} DestinyInventoryItemEntry
 * 
 * @typedef {Record<string, DestinyInventoryItemEntry>} DestinyInventoryItemDefinition
 * 
 * @typedef {{ shortTitle: string; }} DestinyItemCategoryEntry
 * 
 * @typedef {Record<string, DestinyItemCategoryEntry>} DestinyItemCategoryDefinition
 * 
 * @typedef  {{ DestinyActivityDefinition: DestinyActivityDefinition; DestinyInventoryItemDefinition: DestinyInventoryItemDefinition; }} DestinyManifest
 */ 

/** 
 * @returns {Promise<DestinyManifest>}
 */
async function getD2Content() {
  if (await fileExists(MANIFEST_LOCATION)) {
    return JSON.parse(await fs.readFile(MANIFEST_LOCATION, { encoding: 'utf8' }));
  }
  const content = await fetchContent();
  fs.writeFile(MANIFEST_LOCATION, JSON.stringify(content, null, 2));
  return content;
}

/**
 * @typedef {{ statId: string; basic: { value: number; displayValue: string } }} Stat
 * 
 * @typedef {{ referenceId: number; directorActivityHash: number; instanceId: string; mode: number; modes: Array; isPrivate: boolean; membershipType: number }} ActivityDetails
 * 
 * @typedef {{ assists: Stat; completed: Stat; deaths: Stat; kills: Stat; opponentsDefeated: Stat; efficiency: Stat; killsDeathsRatio: Stat; killsDeathsAssists: Stat; score: Stat; activityDurationSeconds: Stat; team: Stat; completionReason: Stat; fireteamId: Stat; startSeconds: Stat; timePlayedSeconds: Stat; playerCount: Stat; teamScore: Stat }} ActivityValues
 * @typedef {{ period: string; activityDetails: ActivityDetails; values: ActivityValues }} Activity
 */

/**
 * 
 * @param {string} membershipType 
 * @param {string} membershipId 
 * @param {string} characterId 
 * @returns {Promise<[Error, null] | [null, Activity[]]>}
 */
async function fetchAllRaidActivities(membershipType, membershipId, characterId) {
  let page = 0,
  exhausted = false;
  const raidActivities = [];
  while (!exhausted) {
    // Destiny2.GetActivityHistory
    const [activityErr, activityData] = await apiGet(`/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?count=250&mode=4&page=${page}`);
    if (activityErr) return [activityErr, null];
    if (!activityData.Response.activities) {
      break;
    }
    raidActivities.push(...activityData.Response.activities);
    exhausted = activityData.Response.activities.length < 250;
    page++;
  }

  return [null, raidActivities];
}

/**
 * @typedef {{ bungieGlobalDisplayName: string; bungieGlobalDisplayNameCode: number; membershipId: string }} D2UserInfo
 * 
 * @typedef {{ destinyUserInfo: D2UserInfo; characterClass: string; emblemHash: number; }} D2Player
 * 
 * @typedef {{ precisionKills: Stat; weaponKillsGrenade: Stat; weaponKillsMelee: Stat; weaponKillsSuper: Stat; weaponKillsAbility: Stat }} PGCRExtendedValues
 * 
 * @typedef {{ uniqueWeaponKills: Stat; uniqueWeaponPrecisionKills: Stat; uniqueWeaponKillsPrecisionKills: Stat }} WeaponStatValues
 * 
 * @typedef {{ referenceId: number; values: WeaponStatValues }} WeaponStats
 * 
 * @typedef {{ weapons?: WeaponStats[]; values: PGCRExtendedValues }} PGCRExtendedStats
 * 
 * @typedef {{ standing: number; score: Omit<Stat, 'statId'>; player: D2Player; characterId: string; values: ActivityValues; extended: PGCRExtendedStats }} PGCREntry
 * 
 * @typedef {{ period: string; activityWasStartedFromBeginning: boolean; entries: PGCREntry[]}} PGCR
 */

/**
 * [Destiny2.GetPostGameCarnageReport](https://bungie-net.github.io/multi/operation_get_Destiny2-GetPostGameCarnageReport.html#operation_get_Destiny2-GetPostGameCarnageReport)
 * @param {string} activityId The ID of the instance (sometimes instanceId)
 * @returns {Promise<[Error, null] | [null, PGCR]>}
 */
async function fetchPGCR(activityId) {
  const [pgcrErr, pgcrResponse] = await apiGet(`/Destiny2/Stats/PostGameCarnageReport/${activityId}/`);
  return [pgcrErr, pgcrResponse.Response];
}

/** 
 * @typedef {Record<string, number>} WeaponKills
 * 
 * @typedef {{ name: string; totalKills: number; totalDeaths: number; sessions: number; }} FireteamMember 
 * 
 * @typedef {Record<string, FireteamMember>} Fireteam
 * 
 * @typedef {{ name: string; lightLevel: number; attempts: number; emblemFullUrl: string; emblemIconUrl:string; totalKills: number; totalDeaths: number; killDeathRatio: number; weaponKills: WeaponKills; weaponKillsByAmmoType: { Primary: WeaponKills; Special: WeaponKills; Heavy: WeaponKills }}} User
 */

/**
 * @param {PGCR[]} raidPgcrs 
 * @param {string} accountId
 * @param {DestinyInventoryItemDefinition} manifest
 * @returns {Omit<User, 'name'>}
 */
function gatherUserRaidStats(raidPgcrs, accountId, manifest) {
  const allUserPgcrStats = /** @type {Omit<User, 'name'>[]} */ ([]);
  for (const pgcr of raidPgcrs) {
    const userEntries = pgcr.entries.filter(entry => entry.player.destinyUserInfo.membershipId === accountId);
    if (userEntries.length === 0) {
      continue;
    }
    const userPgcrStats = userEntries.reduce((stats, userEntry) => {
      stats.totalKills += userEntry.values.kills.basic.value;
      stats.totalDeaths += userEntry.values.deaths.basic.value;
      stats.killDeathRatio = stats.totalKills / (stats.totalDeaths === 0 ? 1 : stats.totalDeaths);
      stats.weaponKills = { 
        ...stats.weaponKills,
        ...userEntry.extended.weapons?.reduce((_weaponKills, weapon) => {
          const weaponName = manifest[weapon.referenceId].displayProperties.name;
          _weaponKills = {
            ..._weaponKills,
            [weaponName]: weapon.values.uniqueWeaponKills.basic.value + (stats.weaponKills[weaponName] ?? 0)
          }
          return _weaponKills;
        }, {})
      };
      stats.weaponKillsByAmmoType = {
        ...stats.weaponKillsByAmmoType,
        ...userEntry.extended.weapons?.reduce((_weaponKillsByAmmoType, weapon) => {
          const weaponName = manifest[weapon.referenceId].displayProperties.name;
          const weaponType = DESTINY_AMMO_TYPE[manifest[weapon.referenceId].equippingBlock.ammoType]
          _weaponKillsByAmmoType = {
            ..._weaponKillsByAmmoType,
            [weaponType]: {
              ..._weaponKillsByAmmoType[weaponType],
              [weaponName]: weapon.values.uniqueWeaponKills.basic.value + (stats.weaponKillsByAmmoType[weaponType][weaponName] ?? 0)
            }
          };
          return _weaponKillsByAmmoType;
        }, /** @type {{ Primary: WeaponKills; Special: WeaponKills; Heavy: WeaponKills }} */ ({ Primary: {}, Special: {}, Heavy: {} }))
      };
      return stats;
    }, /** @type {Omit<User, 'name'>} */ ({
      totalKills: 0,
      totalDeaths: 0,
      killDeathRatio: 0,
      weaponKills: {},
      weaponKillsByAmmoType: {
        Primary: {},
        Special: {},
        Heavy: {}
      },
    }));
    userPgcrStats.attempts = 1;
    allUserPgcrStats.push(userPgcrStats);
  }
  const allStats = allUserPgcrStats.reduce((aggregateUserPgcr, pgcr) => {
    aggregateUserPgcr.totalKills = pgcr.totalKills + aggregateUserPgcr.totalKills;
    aggregateUserPgcr.totalDeaths = pgcr.totalDeaths + aggregateUserPgcr.totalDeaths;
    aggregateUserPgcr.killDeathRatio = aggregateUserPgcr.totalKills / (aggregateUserPgcr.totalDeaths === 0 ? 1 : aggregateUserPgcr.totalDeaths);
    aggregateUserPgcr.attempts += pgcr.attempts;
    for (const [weaponName, kills] of Object.entries(pgcr.weaponKills)) {
      aggregateUserPgcr.weaponKills[weaponName] = kills + (aggregateUserPgcr.weaponKills[weaponName] ?? 0);
    }
    for (const weaponType of Object.values(DESTINY_AMMO_TYPE)) {
      for (const [weaponName, kills] of Object.entries(pgcr.weaponKillsByAmmoType[weaponType])) {
        aggregateUserPgcr.weaponKillsByAmmoType[weaponType][weaponName] = kills + (aggregateUserPgcr.weaponKillsByAmmoType[weaponType][weaponName] ?? 0);
      }
    }
    return aggregateUserPgcr;
  }, /** @type {Omit<User, 'name'>} */ ({
    totalKills: 0,
    totalDeaths: 0,
    killDeathRatio: 0,
    attempts: 0,
    weaponKills: {},
    weaponKillsByAmmoType: {
      Primary: {},
      Special: {},
      Heavy: {}
    },
  }));
  
  // sort weapon kills highest to lowest
  allStats.weaponKills = Object.fromEntries(Object.entries(allStats.weaponKills).sort(([,a],[,b]) => b-a));
  return allStats;
}

/**
 * 
 * @param {PGCR[]} raidPgcrs 
 * @param {string} userId
 * @param {DestinyInventoryItemDefinition} manifest 
 * @returns {Record<string, User>}
 */
function gatherFireteamRaidStats(raidPgcrs, manifest) {
  const fireteam = /** @type {Record<string, User>} */ ({});
  const idToNameMap = {}
  const allFireteamMembers = new Set();
  for (const pgcr of raidPgcrs) {
    pgcr.entries.map(entry => {
      const id = entry.player.destinyUserInfo.membershipId;
      idToNameMap[id] = [entry.player.destinyUserInfo.bungieGlobalDisplayName, entry.player.emblemHash, entry.player.lightLevel];
      return id;
    }).forEach(id => allFireteamMembers.add(id));
  }

  for (const fireteamId of allFireteamMembers) {
    const [name, emblemHash, lightLevel] = idToNameMap[fireteamId];
    const { displayProperties, secondaryIcon } = manifest[emblemHash];
    fireteam[fireteamId] = { 
      ...gatherUserRaidStats(raidPgcrs, fireteamId, manifest),
      name,
      lightLevel,
      emblemIconUrl: displayProperties.icon,
      emblemFullUrl: secondaryIcon
    };
  }

  return fireteam;
}

export { fetchAllRaidActivities, fetchPGCR, gatherFireteamRaidStats, gatherUserRaidStats, getD2Content, isValidD2DayFormat };