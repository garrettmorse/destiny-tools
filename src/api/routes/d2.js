import { Router } from "express";
import { apiGet, apiPost } from "../client.js";
import { db, getDefinition, signed, unsigned } from "../db.js";
import {
  fetchAllRaidActivities,
  fetchPGCR,
  gatherFireteamRaidStats,
} from "../util.js";
import CONSTANTS from "../constants.js";
const d2 = Router();

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
    (result) => result?.destinyMemberships?.length > 0
  );
  return res.json(searchResults);
});

d2.get("/mods", async (_, res) => {
  const mods = db
    .prepare(
      "SELECT json_extract(json, '$.displayProperties.name') AS name, json_extract(json, '$.displayProperties.icon') AS icon FROM DestinyCollectibleDefinition WHERE json_extract(json, '$.scope') = 0 AND json_extract(json, '$.presentationNodeType') = 1 AND json_extract(json, '$.parentNodeHashes[0]') = 1929360037"
    )
    .all();
  return res.json(
    mods.reduce(
      (acc, mod) => ({
        ...acc,
        [mod.name]: mod.icon,
      }),
      {}
    )
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
  const raidActivityTypeHash = db
    .prepare(
      "SELECT id FROM DestinyActivityTypeDefinition WHERE json_extract(json, '$.displayProperties.name') = 'Raid'"
    )
    .get().id;
  const raids = db
    .prepare(
      "SELECT id, json_extract(json, '$.originalDisplayProperties.name') AS name, json_extract(json, '$.pgcrImage') AS image FROM DestinyActivityDefinition WHERE json_extract(json, '$.activityTypeHash') = ? AND json_extract(json, '$.originalDisplayProperties.name') NOT LIKE '%Pantheon%'"
    )
    .all(raidActivityTypeHash);

  return res.json(
    raids
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
      }, {})
  );
});

d2.get("/aggregateRaids", async (req, res) => {
  const { raidIds, userId, last } = req.query;
  if (!raidIds) {
    return res.status(400).json({ error: 'Missing "raidIds" query parameter' });
  }
  const raidIdArr = raidIds.split(",");

  const validateRaidStmt =
    "SELECT json_extract(json, '$.originalDisplayProperties.name') AS name FROM DestinyActivityDefinition WHERE id = ?";
  const firstRaidColloquialName = db
    .prepare(validateRaidStmt)
    .get(signed(raidIdArr[0]))?.name;
  if (!firstRaidColloquialName) {
    return res.status(400).json({ error: `Invalid raidId "${raidIdArr[0]}"` });
  }

  const remainingRaidIds = raidIdArr.slice(1);
  const allRaidsStmt = `SELECT json_extract(json, '$.originalDisplayProperties.name') AS name FROM DestinyActivityDefinition WHERE id IN (${remainingRaidIds
    .map(() => "?")
    .join(",")})`;
  const allRaidNames = db
    .prepare(allRaidsStmt)
    .all(remainingRaidIds.map((id) => signed(id)))
    ?.map((raid) => raid.name);
  if (!allRaidNames.every((name) => name === firstRaidColloquialName)) {
    return res.status(400).json({
      error: `Not all raidIds map to the same raid: ${raidIdArr.map(
        (id) =>
          `(${id}, ${
            getDefinition("Activity", id)?.originalDisplayProperties?.name ??
            "N/A"
          })`
      )}`,
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
    `/Destiny2/-1/Profile/${userId}/LinkedProfiles/`
  );
  if (linkedErr) {
    console.error("Kaboom while retrieving Linked D2 Profiles");
    return res.status(500).json(CONSTANTS.ERRORS[500]);
  }

  const { profiles } = /** @type {{ profiles: any[]}} */ (linkedData.Response);
  const sortedProfiles = profiles.sort(
    ({ dateLastPlayedA }, { dateLastPlayedB }) =>
      new Date(dateLastPlayedB) - new Date(dateLastPlayedA)
  );
  const mostRecentlyPlayedProfile = sortedProfiles[0];
  const {
    membershipType,
    membershipId,
    bungieGlobalDisplayName: name,
  } = mostRecentlyPlayedProfile;
  // Destiny2.GetProfile
  const [profileErr, profileData] = await apiGet(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`
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
      characterId
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
    return res.status(409).json({
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
    (activity) => activity.activityDetails.instanceId
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

  const fireteam = gatherFireteamRaidStats(allActivityReports);
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
