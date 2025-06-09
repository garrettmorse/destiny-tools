import { Router } from "express";
import { apiGet, apiPost } from "../client.js";
import {
  fetchAllRaidActivities,
  fetchPGCR,
  gatherFireteamRaidStats,
  getD2Content,
} from "../util.js";
import CONSTANTS from "../constants.js";
const d2 = Router();

// we only retrieve
// - DestinyActivityDefinition
// - DestinyActivityTypeDefinition
// - DestinyCollectibleDefinition
// - DestinyInventoryItemDefinition
//  - items with ammotypes only
const content = await getD2Content();

// UI will debounce and call this every 0.5 sec
d2.get("/searchUser", async (req, res) => {
  const { user } = req.query;
  if (!user) {
    return res.status(400).json({ error: 'Missing "user" query parameter' });
  }
  // User.SearchByGlobalNamePost
  const [err, data] = await apiPost("/User/Search/GlobalName/0/", {
    displayNamePrefix: user,
  });
  if (err) {
    console.error("Kaboom while searching for Users");
    return res.status(500).json(CONSTANTS.ERRORS[500]);
  }
  const searchResults = data.Response.searchResults.filter(
    (result) => result?.destinyMemberships?.length > 0,
  );
  return res.json(searchResults);
});

d2.get("/mods", async (_, res) => {
  return res.json(
    Object.values(content.DestinyCollectibleDefinition).reduce(
      (acc, mod) => ({
        ...acc,
        [mod.displayProperties.name]: mod.displayProperties.icon,
      }),
      {},
    ),
  );
});

d2.get("/raids", async (_, res) => {
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
    "Vault of Glass: Challenge Mode": 9,
    "Vow of the Disciple": 10,
    "King's Fall": 11,
    "Root of Nightmares": 12,
    "Crota's End": 13,
    "Salvation's Edge": 14,
  };
  RAID_SORT_MAP.default = Object.keys(RAID_SORT_MAP).length + 1;
  return res.json(
    Object.entries(content.DestinyActivityDefinition)
      .filter(
        ([_, data]) =>
          data.activityTypeHash !== 0 &&
          content.DestinyActivityTypeDefinition[data.activityTypeHash]
            .displayProperties.name === "Raid",
      ) // n
      .map(([hash, data]) => [
        data.originalDisplayProperties.name,
        hash,
        data.pgcrImage,
      ])
      .filter(([name]) => !name.includes("Pantheon")) // m
      .sort(
        ([raidA], [raidB]) =>
          (RAID_SORT_MAP[raidA] ?? RAID_SORT_MAP.default++) -
          (RAID_SORT_MAP[raidB] ?? RAID_SORT_MAP.default++),
      )
      .reverse()
      .reduce((raidMap, [raid, hash, image]) => {
        if (!raidMap[raid]) {
          raidMap[raid] = { ids: [], imgUrl: image };
        }
        raidMap[raid].ids.push(hash);
        return raidMap;
      }, {}),
  );
});

d2.get("/aggregateRaids", async (req, res) => {
  const { raidIds, userId, last } = req.query;
  if (!raidIds) {
    return res.status(400).json({ error: 'Missing "raidIds" query parameter' });
  }
  const raidIdArr = raidIds.split(",");
  const firstRaidColloquialName =
    content.DestinyActivityDefinition[raidIdArr[0]]?.originalDisplayProperties
      .name;
  if (!firstRaidColloquialName) {
    return res.status(400).json({ error: `Invalid raidId "${raidIdArr[0]}"` });
  }
  if (
    !raidIdArr
      .slice(1)
      .every(
        (id) =>
          content.DestinyActivityDefinition[id]?.originalDisplayProperties
            .name === firstRaidColloquialName,
      )
  ) {
    return res
      .status(400)
      .json({
        error: `Not all raidIds map to the same raid: ${raidIdArr.map((id) => `(${id}, ${content.DestinyActivityDefinition[id]?.originalDisplayProperties?.name ?? "N/A"})`)}`,
      });
  }
  if (!userId) {
    return res.status(400).json({ error: 'Missing "userId" query parameter' });
  }
  if (typeof userId !== "string") {
    return res.status(400).json({ error: '"userId" must be a string.' });
  }
  // if (!last) {
  //   return res.status(400).json({ error: 'Missing "last" query parameter'});
  // }
  // if (!Number(last)) {
  //   return res.status(400).json({ error: '"last" query parameter must be a Number.'});
  // }

  // Destiny2.GetLinkedProfiles
  const [linkedErr, linkedData] = await apiGet(
    `/Destiny2/-1/Profile/${userId}/LinkedProfiles/`,
  );
  if (linkedErr) {
    console.error("Kaboom while retrieving Linked D2 Profiles");
    return res.status(500).json(CONSTANTS.ERRORS[500]);
  }

  const { profiles } = /** @type {{ profiles: any[]}} */ (linkedData.Response);
  const sortedProfiles = profiles.sort(
    ({ dateLastPlayedA }, { dateLastPlayedB }) =>
      new Date(dateLastPlayedB) - new Date(dateLastPlayedA),
  );
  const mostRecentlyPlayedProfile = sortedProfiles[0];
  const {
    membershipType,
    membershipId,
    bungieGlobalDisplayName: name,
  } = mostRecentlyPlayedProfile;
  // Destiny2.GetProfile
  const [profileErr, profileData] = await apiGet(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`,
  );
  if (profileErr) {
    console.error("Kaboom while retrieving D2 Profile");
    return res.status(500).json(CONSTANTS.ERRORS[500]);
  }

  const { characters } = profileData.Response;
  const characterIds = Object.keys(characters.data);
  const allRaidActivities = [];
  for (const characterId of characterIds) {
    const [raidActivityErr, raidActivityData] = await fetchAllRaidActivities(
      membershipType,
      membershipId,
      characterId,
    );
    if (raidActivityErr) {
      console.error("Kaboom while retrieving D2 Raid activities");
      console.error(raidActivityErr);
      return res.status(500).json(CONSTANTS.ERRORS[500]);
    }
    allRaidActivities.push(...raidActivityData);
  }

  // instanceId is an activity ID that can be used to retrieve a PGCR
  const allRequestedRaidActivities = [];
  for (const raidId of raidIdArr) {
    const requestedRaidActivities = allRaidActivities.filter(
      (activity) => String(activity.activityDetails.referenceId) === raidId,
    );
    allRequestedRaidActivities.push(...requestedRaidActivities);
  }
  allRequestedRaidActivities.sort(
    (activityA, activityB) =>
      new Date(activityB.period) - new Date(activityA.period),
  );
  // find most recent completion
  const mostRecentCompletion = allRequestedRaidActivities.find(
    (activity) => activity.values.completed.basic.value === 1,
  );
  if (!mostRecentCompletion) {
    return res
      .status(409)
      .json({
        error: `No completions on record for "${firstRaidColloquialName}".`,
      });
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

  // TODO: now that we have all requested raid activities, we need to use the instance IDs to retrieve PGCRs and begin analysis
  // instance IDs map to PGCRs
  const relevantInstanceIds = relevantRaids.map(
    (activity) => activity.activityDetails.instanceId,
  );
  /** @type {import('../util').PGCR[]} */
  const allActivityReports = [];
  for (const instanceId of relevantInstanceIds) {
    const [pgcrErr, pgcrData] = await fetchPGCR(instanceId);
    if (pgcrErr) {
      console.error("Kaboom while retrieving D2 PGCRs");
      console.error(pgcrErr);
      return res.status(500).json(CONSTANTS.ERRORS[500]);
    }
    allActivityReports.push(pgcrData);
  }

  const fireteam = gatherFireteamRaidStats(
    allActivityReports,
    content.DestinyInventoryItemDefinition,
  );
  const userStats = fireteam[membershipId];
  delete fireteam[membershipId];
  return res.json({
    user: {
      name,
      ...userStats,
    },
    fireteam,
  });
});

export { d2 };
