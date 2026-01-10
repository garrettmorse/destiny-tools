import { destinyDb, unsigned, signed, getDefinition } from "../db.js";
import { getRaidActivityTypeHash } from "./definitions.js";

/**
 * Raid sort order map
 */
const RAID_SORT_MAP = {
  Leviathan: 0,
  "Leviathan, Eater of Worlds": 1,
  "Leviathan, Spire of Stars": 2,
  "Scourge of the Past": 3,
  "Crown of Sorrow": 4,
  "Last Wish": 5,
  "Garden of Salvation": 6,
  "Deep Stone Crypt": 7,
  "Vault of Glass": 8,
  "Vault of Glass: Challenge Mode": 8,
  "Vow of the Disciple": 9,
  "King's Fall": 10,
  "Root of Nightmares": 11,
  "Crota's End": 12,
  "Salvation's Edge": 13,
  "The Desert Perpetual": 14,
  "The Desert Perpetual: (Epic)": 15,
};
RAID_SORT_MAP.default = Object.keys(RAID_SORT_MAP).length + 1;

/**
 * Get all raids from the database
 * @returns {Object} Raid map with raid names as keys
 */
export function getAllRaids() {
  const raidActivityTypeHash = getRaidActivityTypeHash();
  const raids = destinyDb
    .prepare(
      "SELECT id, json_extract(json, '$.originalDisplayProperties.name') AS name, json_extract(json, '$.pgcrImage') AS image FROM DestinyActivityDefinition WHERE json_extract(json, '$.activityTypeHash') = ? AND json_extract(json, '$.originalDisplayProperties.name') NOT LIKE '%Pantheon%'"
    )
    .all(raidActivityTypeHash);

  return raids
    .sort(
      (raidA, raidB) =>
        (RAID_SORT_MAP[raidA.name] ?? RAID_SORT_MAP.default++) -
        (RAID_SORT_MAP[raidB.name] ?? RAID_SORT_MAP.default++)
    )
    .reverse()
    .reduce((raidMap, { id, name, image }) => {
      // for some reason this is the only contest-exclusive version of a raid that appears.
      // not digging into it at the moment.
      if (name === "Vault of Glass: Challenge Mode") {
        return raidMap;
      }

      if (!raidMap[name]) {
        raidMap[name] = { ids: [], imgUrl: image };
      }

      raidMap[name].ids.push(unsigned(id));
      return raidMap;
    }, {});
}

/**
 * Validate that all raid IDs map to the same raid
 * @param {string[]} raidIdArr
 * @returns {{ valid: boolean; raidName?: string; error?: string }}
 */
export function validateRaidIds(raidIdArr) {
  const validateRaidStmt =
    "SELECT json_extract(json, '$.originalDisplayProperties.name') AS name FROM DestinyActivityDefinition WHERE id = ?";
  const firstRaidColloquialName = destinyDb
    .prepare(validateRaidStmt)
    .get(signed(raidIdArr[0]))?.name;

  if (!firstRaidColloquialName) {
    return { valid: false, error: `Invalid raidId "${raidIdArr[0]}"` };
  }

  const remainingRaidIds = raidIdArr.slice(1);
  if (remainingRaidIds.length === 0) {
    return { valid: true, raidName: firstRaidColloquialName };
  }

  const allRaidsStmt = `SELECT json_extract(json, '$.originalDisplayProperties.name') AS name FROM DestinyActivityDefinition WHERE id IN (${remainingRaidIds
    .map(() => "?")
    .join(",")})`;
  const allRaidNames = destinyDb
    .prepare(allRaidsStmt)
    .all(remainingRaidIds.map((id) => signed(id)))
    ?.map((raid) => raid.name);

  if (!allRaidNames.every((name) => name === firstRaidColloquialName)) {
    return {
      valid: false,
      error: `Not all raidIds map to the same raid: ${raidIdArr.map(
        (id) =>
          `(${id}, ${
            getDefinition("Activity", id)?.originalDisplayProperties?.name ??
            "N/A"
          })`
      )}`,
    };
  }

  return { valid: true, raidName: firstRaidColloquialName };
}

/**
 * Find the most recent raid completion and relevant activities
 * @param {any[]} allRaidActivities - All raid activities for a character
 * @param {string[]} raidIdArr - Array of raid IDs to filter
 * @returns {{ mostRecentCompletion?: any; relevantRaids?: any[]; error?: string }}
 */
export function findRelevantRaidActivities(allRaidActivities, raidIdArr) {
  const allRequestedRaidActivities = [];
  for (const raidId of raidIdArr) {
    const requestedRaidActivities = allRaidActivities.filter(
      (activity) => String(activity.activityDetails.referenceId) === raidId
    );
    allRequestedRaidActivities.push(...requestedRaidActivities);
  }

  allRequestedRaidActivities.sort(
    (activityA, activityB) =>
      new Date(activityB.period) - new Date(activityA.period)
  );

  // find most recent completion
  const mostRecentCompletion = allRequestedRaidActivities.find(
    (activity) => activity.values.completed.basic.value === 1
  );

  if (!mostRecentCompletion) {
    return { error: "No completions found" };
  }

  // the list of raid activities that eventually led to mostRecentCompletion
  const relevantRaids = [mostRecentCompletion];
  for (const raidActivity of allRequestedRaidActivities.slice(1)) {
    // stop at the next most recent completion
    if (raidActivity.values.completed.basic.value === 1) {
      break;
    }
    // include all failures prior
    relevantRaids.push(raidActivity);
  }

  return { mostRecentCompletion, relevantRaids };
}
