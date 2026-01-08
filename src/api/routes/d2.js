import { Router } from "express";
import { apiClient, apiGet, apiPost } from "../client.js";
import { appDb, destinyDb, getDefinition, signed, unsigned } from "../db.js";
import {
  fetchAllRaidActivities,
  fetchPGCR,
  gatherFireteamRaidStats,
} from "../util.js";
import { authorize } from "../auth.js";
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
  const mods = destinyDb
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
  const raidActivityTypeHash = destinyDb
    .prepare(
      "SELECT id FROM DestinyActivityTypeDefinition WHERE json_extract(json, '$.displayProperties.name') = 'Raid'"
    )
    .get().id;
  const raids = destinyDb
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
  const firstRaidColloquialName = destinyDb
    .prepare(validateRaidStmt)
    .get(signed(raidIdArr[0]))?.name;
  if (!firstRaidColloquialName) {
    return res.status(400).json({ error: `Invalid raidId "${raidIdArr[0]}"` });
  }

  const remainingRaidIds = raidIdArr.slice(1);
  const allRaidsStmt = `SELECT json_extract(json, '$.originalDisplayProperties.name') AS name FROM DestinyActivityDefinition WHERE id IN (${remainingRaidIds
    .map(() => "?")
    .join(",")})`;
  const allRaidNames = destinyDb
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

const INVENTORY_COMPONENTS = "102,200,201,205,300,302,304,305";
// 102: Vault
// 200: Characters (needed for character IDs in inventories)
// 201: CharacterInventories (non-equipped on chars)
// 205: CharacterEquipment (equipped)
// 300: ItemInstances (instance data like gearTier, damage type, etc.)
// 302: ProfileCurrencies
// 304: ItemStats (stat values for items)
// 305: ItemSockets (socket and plug data for items)

/**
 * @typedef ProfileResponse
 * @type {{ Response: ProfileData; ErrorCode: number; ThrottleSeconds: number; ErrorStatus: string; Message: string; MessageData: {} }}
 *
 * @typedef ProfileData
 * @type {{ profileInventory: ProfileInventory; profilePlugSets: ProfilePlugSets; characters: Characters; characterInventories: CharacterInventories; characterEquipment: CharacterEquipment; characterPlugSets: CharacterPlugSets; itemComponents: ItemComponents; }}
 *
 * @typedef ProfileInventory
 * @type {{ data: { items: InventoryItem[] }; privacy: number; }}
 *
 * @typedef ProfilePlugSets
 * @type {{ data: { plugs: { [plugHash: string]: PlugSet[] } }; privacy: number; }}
 *
 * @typedef PlugSet
 * @type {{ plugItemHash: number; canInsert: boolean; enabled: boolean }}
 *
 * @typedef Characters
 * @type {{ data: { [characterHash: string]: CharacterData }; privacy: number; }}
 *
 * @typedef CharacterData
 * @type {{ membershipId: string; membershipType: number; characterId: string; dateLastPlayed: string; minutesPlayedThisSession: string; minutesPlayedTotal: string; light: number; stats: { [statHash: string]: number }; raceHash: number; genderHash: number; classHash: number; raceType: number; classType: number; genderType: number; emblemPath: string; emblemBackgroundPath: string; emblemHash: number; emblemColor: { red: number; green: number; blue: number; alpha: number; }; levelProgression: LevelProgression; baseCharacterLevel: number; percentToNextLevel: number; titleRecordHash: number; }}
 *
 * @typedef LevelProgression
 * @type {{ progressionHash: number; dailyProgress: number; dailyLimit: number; weeklyProgress: number; weeklyLimit: number; currentProgress: number; level: number; levelCap: number; stepIndex: number; progressToNextLevel: number; nextLevelAt: number; }}
 *
 * @typedef CharacterInventories
 * @type {{ data: { [characterHash: string]: CharacterInventory }; privacy: number; }}
 *
 * @typedef CharacterInventory
 * @type {{ items: InventoryItem[] }}
 *
 * @typedef CharacterEquipment
 * @type {{ data: { [characterHash: string]: CharacterInventory }; privacy: number; }}
 *
 * @typedef CharacterPlugSets
 * @type {{ data: { [characterHash: string]: { plugs: { [plugHash: string]: PlugSet[] }}}; privacy: number; }}
 *
 * @typedef ItemComponents
 * @type {{ instances: { data: { [itemInstanceId: string]: ItemComponentInstance; }; privacy: number; }; stats: { data: { [itemInstanceId: string]: ItemStatInstance; }; privacy: number; }; sockets: { data: { [itemInstanceId: string]: ItemSocketInstance; }; privacy: number; }; perks: { data: { [itemInstanceId: string]: ItemPerkInstance }; privacy: number; }}}
 *
 * @typedef ItemComponentInstance
 * @type {{ damageType: number; damageTypeHash: number; primaryStat: { statHash: number; value: number }; itemLevel: number; quality: number; isEquipped: boolean; canEquip: boolean; equipRequiredLevel: number; unlockHashesRequiredToEquip: number[]; cannotEquipReason: number; gearTier: number; }}
 *
 * @typedef ItemStatInstance
 * @type {{ stats: { [statHash: string]: { statHash: number; value: number }}}}
 *
 * @typedef ItemSocketInstance
 * @type {{ sockets: Socket[] }}
 *
 * @typedef Socket
 * @type {{ plugHash: number; isEnabled: boolean; isVisible: boolean }}
 *
 * @typedef ItemPerkInstance
 * @type {{ perks: Perk[] }}
 *
 * @typedef Perk
 * @type {{ perkHash: number; iconPath: string; isActive: boolean; visible: boolean; }}
 *
 * @typedef InventoryItem
 * @type {{ itemHash: number; itemInstanceId?: string; quantity: number; bindStatus: number; location: number; bucketHash: number; transferStatus: number; lockable: boolean; state: number; dismantlePermission: number; isWrapper: boolean; tooltipNotificationIndexes: number[]; versionNumber?: number; }}
 *
 * @typedef Armor
 * @type {{ instance_id: string; item_hash: number; name: string; slot: string; class: string; armor_set?: string; icon: string; archetype: string; tertiary: string; ghost_mod?: string }}
 */

/**
 * @param {string} membershipType
 * @param {string} membershipId
 * @param {string} accessToken
 * @returns {Promise<ProfileResponse>}
 */
async function fetchFullInventory(membershipType, membershipId, accessToken) {
  const res = await apiClient.get(
    `/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=${INVENTORY_COMPONENTS}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return res.data;
}

/**
 * @param {ProfileData} data
 * @returns {number[]}
 */
function extractInstanceIds(data) {
  const instanceIds = new Set();

  /**
   * @param {InventoryItem[]} items
   */
  const addItems = (items) => {
    if (!items) return;
    for (const item of items) {
      if (item.itemInstanceId) {
        instanceIds.add(item.itemInstanceId.toString()); // use string for safety
      }
    }
  };

  // Character inventories (non-equipped)
  if (data.characterInventories?.data) {
    Object.values(data.characterInventories.data).forEach((char) =>
      addItems(char.items)
    );
  }

  // Character equipment (equipped)
  if (data.characterEquipment?.data) {
    Object.values(data.characterEquipment.data).forEach((char) =>
      addItems(char.items)
    );
  }

  // Profile inventory (vault, postmaster, etc.)
  if (data.profileInventory?.data?.items) {
    addItems(data.profileInventory.data.items);
  }

  return Array.from(instanceIds);
}

/**
 * @param {ProfileData} data
 * @param {boolean} [isPolling=false] - Whether to extract ghost armorer mod (only during polling)
 * @returns {Armor[]}
 */
function extractArmor(data, isPolling = false) {
  const armor = [];
  let ghostArmorerMod = isPolling ? "" : null;

  // First, if polling, find the most recently played character's ghost and extract its armorer mod
  if (isPolling && data.characterEquipment?.data && data.characters?.data) {
    // Find the most recently played character
    let mostRecentCharId = null;
    let mostRecentDate = null;

    for (const [charId, charData] of Object.entries(data.characters.data)) {
      const dateLastPlayed = new Date(charData.dateLastPlayed);
      if (!mostRecentDate || dateLastPlayed > mostRecentDate) {
        mostRecentDate = dateLastPlayed;
        mostRecentCharId = charId;
      }
    }

    // Extract ghost mod from the most recently played character's equipment
    if (mostRecentCharId && data.characterEquipment.data[mostRecentCharId]) {
      const activeCharEquipment =
        data.characterEquipment.data[mostRecentCharId];
      for (const item of activeCharEquipment.items || []) {
        if (item?.bucketHash === ghostBucketHash) {
          // Found the equipped ghost on active character
          const instanceId = item.itemInstanceId;
          if (instanceId) {
            const sockets =
              data.itemComponents?.sockets?.data?.[instanceId]?.sockets;
            if (sockets) {
              // Look for the armorer mod using cached hash map
              for (const socket of sockets) {
                if (
                  socket.plugHash &&
                  ghostEconomicModHashes[socket.plugHash]
                ) {
                  ghostArmorerMod = ghostEconomicModHashes[socket.plugHash];
                  break;
                }
              }
            }
          }
          break;
        }
      }
    }
  }

  /**
   * Process a single armor item
   * @param {any} item - The item from inventory
   */
  const processArmorItem = (item) => {
    // Check if it's armor (not ghost, just regular armor)
    // use DestinyInventoryBucketDefinition cache for armor buckets
    if (!armorBucketHashes[item?.bucketHash]) return;

    const instanceId = item.itemInstanceId;
    if (!instanceId) return;

    // Only process Legendary armor (tierType 5 = Legendary)
    // Note: gearTier is about stat distribution quality (tier 1/2), not rarity
    const isLegendary =
      data.itemComponents.instances.data[instanceId]?.gearTier === 5;
    if (!isLegendary) return;

    // Get socket data from itemComponents
    const sockets = data.itemComponents?.sockets?.data?.[instanceId]?.sockets;
    if (!sockets) return;

    // Get armor metadata from cache
    const cachedItem = armorItemCache[item.itemHash];
    if (!cachedItem) return; // Not a legendary armor piece

    const itemDef = getDefinition("InventoryItem", item.itemHash);
    if (!itemDef) return;
    const name = itemDef.displayProperties?.name || "Unknown";

    // Extract slot, class, icon, and armor set from cache
    const slot = armorBucketHashes[item.bucketHash] || "Unknown";
    const { icon, class: className, armorSet } = cachedItem;

    // Extract archetype and tertiary stat from sockets
    let archetype = null;
    let tertiary = null;
    let archetypePrimaryStat = null;
    let archetypeSecondaryStat = null;

    for (const socket of sockets) {
      if (socket.plugHash && armorArchetypeHashes[socket.plugHash]) {
        // Found archetype socket using cached hash map
        archetype = armorArchetypeHashes[socket.plugHash];

        // Get primary/secondary stats from static mapping
        const archetypeStats = archetypeStatMapping[archetype];
        if (archetypeStats) {
          archetypePrimaryStat = archetypeStats.primary;
          archetypeSecondaryStat = archetypeStats.secondary;
        }
        break; // Found archetype, no need to continue
      }
    }

    // Now extract the tertiary stat from the item's actual stats (component 304)
    // The tertiary is the highest value among the 4 stats NOT in the archetype

    if (archetypePrimaryStat && archetypeSecondaryStat) {
      const itemStats = data.itemComponents?.stats?.data?.[instanceId]?.stats;

      if (itemStats) {
        // Find the tertiary stat (highest value among non-archetype stats)
        let maxValue = 0;
        let tertiaryStatName = null;
        for (const [statHash, statName] of Object.entries(armorStatHashes)) {
          // Skip archetype primary and secondary stats
          if (
            statName === archetypePrimaryStat ||
            statName === archetypeSecondaryStat
          ) {
            continue;
          }

          const statValue = itemStats[statHash]?.value || 0;
          if (statValue > maxValue) {
            maxValue = statValue;
            tertiaryStatName = statName;
          }
        }

        tertiary = tertiaryStatName;
      }
    }

    armor.push({
      instance_id: instanceId.toString(),
      item_hash: item.itemHash,
      name,
      slot,
      archetype: archetype || "Unknown",
      tertiary: tertiary || "Unknown",
      ghost_mod: ghostArmorerMod, // Will be null if not polling, or the mod name if polling
    });
  };

  // Process character inventories (non-equipped)
  if (data.characterInventories?.data) {
    Object.values(data.characterInventories.data).forEach((char) => {
      char.items?.forEach(processArmorItem);
    });
  }

  // Process character equipment (equipped armor)
  if (data.characterEquipment?.data) {
    Object.values(data.characterEquipment.data).forEach((char) => {
      char.items?.forEach(processArmorItem);
    });
  }

  // Process profile inventory (vault, postmaster, etc.)
  if (data.profileInventory?.data?.items) {
    data.profileInventory.data.items.forEach(processArmorItem);
  }

  return armor;
}

/** @type {{ [hash:string]: string}} */
const armorArchetypeHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') as archetype FROM DestinyInventoryItemDefinition WHERE json_extract(json, '$.plug.plugCategoryIdentifier') = 'armor_archetypes'"
  )
  .all()
  .reduce(
    (archetypes, { id, archetype }) => ({
      ...archetypes,
      [unsigned(id)]: archetype,
    }),
    {}
  );

// Archetype name to primary/secondary stat mapping
const archetypeStatMapping = {
  Specialist: { primary: "Class", secondary: "Weapons" },
  Gunner: { primary: "Weapons", secondary: "Grenade" },
  Bulwark: { primary: "Health", secondary: "Class" },
  Grenadier: { primary: "Grenade", secondary: "Super" },
  Paragon: { primary: "Super", secondary: "Melee" },
  Brawler: { primary: "Melee", secondary: "Health" },
};

/** @type {{ [hash: string]: string }} */
const armorBucketHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') as bucket FROM DestinyInventoryBucketDefinition WHERE json_extract(json, '$.index') > 2 AND json_extract(json, '$.index') < 8;"
  )
  .all()
  .reduce(
    (buckets, { id, bucket }) => ({ ...buckets, [unsigned(id)]: bucket }),
    {}
  );

/** @type {{ [hash: string]: string }} */
const weaponBucketHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') as bucket FROM DestinyInventoryBucketDefinition WHERE json_extract(json, '$.index') > -1 AND json_extract(json, '$.index') < 3;"
  )
  .all()
  .reduce(
    (buckets, { id, bucket }) => ({ ...buckets, [unsigned(id)]: bucket }),
    {}
  );

/** @type {string} */
const ghostBucketHash = unsigned(
  destinyDb
    .prepare(
      "SELECT id FROM DestinyInventoryBucketDefinition WHERE json_extract(json, '$.displayProperties.name') = 'Ghost'"
    )
    .get().id
);

const armorStatHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') AS stat FROM DestinyStatDefinition WHERE json_extract(json, '$.statCategory') = 2;"
  )
  .all()
  .reduce((stats, { id, stat }) => ({ ...stats, [unsigned(id)]: stat }), {});

/** @type {{ [hash:string]: string}} */
const ghostEconomicModHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') as name FROM DestinyInventoryItemDefinition WHERE json_extract(json, '$.displayProperties.name') LIKE '%Armorer%' AND json_extract(json, '$.plug.plugCategoryIdentifier') = 'enhancements.ghosts_economic'"
  )
  .all()
  .reduce(
    (mods, { id, name }) => ({
      ...mods,
      [unsigned(id)]: name,
    }),
    {}
  );

// Cache armor item metadata (icon, class, armor set name) by item hash
/** @type {{ [hash: number]: { icon: string; class: string; armorSet: string | null }}} */
const armorItemCache = {};

// Populate armor item cache for all legendary armor
const legendaryArmorItems = destinyDb
  .prepare(
    `SELECT
      ii.id,
      json_extract(ii.json, '$.displayProperties.icon') as icon,
      json_extract(ii.json, '$.classType') as classType,
      json_extract(eis.json, '$.displayProperties.name') as armorSet
    FROM DestinyInventoryItemDefinition ii
    INNER JOIN DestinyEquipableItemSetDefinition eis ON json_extract(eis.json, '$.hash') = json_extract(ii.json, '$.equippingBlock.equipableItemSetHash')
    WHERE json_extract(ii.json, '$.equippingBlock.equipableItemSetHash') IS NOT NULL`
  )
  .all();

for (const item of legendaryArmorItems) {
  const hash = unsigned(item.id);
  const classType = item.classType;
  let className = "Unknown";
  if (classType === 0) className = "Titan";
  else if (classType === 1) className = "Hunter";
  else if (classType === 2) className = "Warlock";

  armorItemCache[hash] = {
    icon: item.icon || "",
    class: className,
    armorSet: item.armorSet || null,
  };
}

async function storeUserInventoryData(
  username,
  d2Id,
  accountType,
  accessToken,
  isPolling
) {
  // Take initial snapshot immediately
  const profileData = await fetchFullInventory(accountType, d2Id, accessToken);
  // cache debugging: this timestamp shows when Bungie API produced the response
  // console.log({ responseMinted: profileData.Response.responseMintedTimestamp });
  // now that we have full inventory, we need to map instanced items to armor traits/weapon traits
  const allInstanceIds = extractInstanceIds(profileData.Response);

  // Filter out instance IDs that already exist in the database
  let newInstanceIds = allInstanceIds;
  // debug: log total items on profile
  // console.log(`${username} total items: ${allInstanceIds.length}`);
  if (allInstanceIds.length > 0) {
    const existingInstanceIds = appDb
      .prepare(
        `SELECT instance_id FROM user_loot WHERE instance_id IN (${allInstanceIds
          .map(() => "?")
          .join(",")})`
      )
      .all(...allInstanceIds)
      .map((row) => row.instance_id);

    const existingSet = new Set(existingInstanceIds);
    newInstanceIds = allInstanceIds.filter((id) => !existingSet.has(id));
  }

  // Only insert NEW instance IDs
  if (newInstanceIds.length > 0) {
    const createUserLootStmt = appDb.prepare(
      `INSERT INTO user_loot (mem_id, instance_id) VALUES ${newInstanceIds
        .map(() => `(?, ?)`)
        .join(",")};`
    );
    const params = newInstanceIds.flatMap((id) => [d2Id, id]);
    createUserLootStmt.run(...params);
  }

  // Extract armor and filter to only NEW pieces
  const allArmor = extractArmor(profileData.Response, isPolling);
  const newArmor = allArmor.filter((armor) =>
    newInstanceIds.includes(armor.instance_id)
  );

  // Only insert NEW armor
  if (newArmor.length > 0) {
    const createArmorStmt = appDb.prepare(
      `INSERT INTO armor (instance_id, item_hash, name, slot, archetype, tertiary, ghost_mod)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const insertMany = appDb.transaction((armorPieces) => {
      for (const armor of armorPieces) {
        createArmorStmt.run(
          armor.instance_id,
          armor.item_hash,
          armor.name,
          armor.slot,
          armor.archetype,
          armor.tertiary,
          armor.ghost_mod
        );
      }
    });
    console.log(`${username}: inserting ${newArmor.length} armor pieces...`);
    insertMany(newArmor);
  }

  // store weapons
  // TODO: implement weapon extraction and storage

  // Return new loot for the armor feed
  return newArmor.map((armor) => ({
    ...armor,
    ...armorItemCache[armor.item_hash],
  }));
}

d2.get("/authorize", authorize, async (req, res) => {
  if (res?.locals?.token) {
    const { token } = res.locals;
    try {
      const { data } = await apiClient.get(
        `/Platform/User/GetMembershipsById/${token.membership_id}/254/`
      );

      const { Response } = data;
      const { destinyMemberships } = Response;
      const primaryDestiny =
        destinyMemberships.find((m) => m.crossSaveOverride !== 0) ||
        destinyMemberships[0];
      if (!primaryDestiny) {
        throw new Error("No linked Destiny 2 profiles found.");
      }

      const { membershipId: d2Id, membershipType: d2Type } = primaryDestiny;
      const username =
        primaryDestiny.bungieGlobalDisplayName || primaryDestiny.displayName;

      (token.d2Id = d2Id), (token.d2Type = d2Type);

      // store user
      const createUserStmt = appDb.prepare(
        "INSERT OR IGNORE INTO users (mem_id, mem_type, name) VALUES (?,?,?);"
      );
      createUserStmt.run(d2Id, d2Type, username);
      await storeUserInventoryData(
        username,
        d2Id,
        d2Type,
        token.access_token,
        false
      );
      return res
        .cookie("BNET_AUTH", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: token.expires_in * 1000,
        })
        .status(202)
        .json({
          msg: "success",
          membershipId: d2Id,
          membershipType: d2Type,
          bungieName: username,
        });
    } catch (err) {
      console.error("Membership fetch error:", err);
      return res.status(500).json({ msg: "Failed to fetch Destiny profile." });
    }
  }

  return res.status(202).json({
    msg: "still authorized",
  });
});

d2.get("/pollLoot", authorize, async (req, res) => {
  try {
    const token = req.cookies.BNET_AUTH;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { d2Id, d2Type } = token;
    if (!d2Id) {
      return res.status(400).json({ error: "No Destiny Membership ID found" });
    }

    const createUserStmt = appDb.prepare(
      "SELECT name FROM users WHERE mem_id = ?;"
    );
    const username = createUserStmt.get(d2Id).name;

    const newArmor = await storeUserInventoryData(
      username,
      d2Id,
      d2Type,
      token.access_token,
      true
    );

    res.json({ new: newArmor });
  } catch (err) {
    console.error("Poll loot error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

d2.get("/armorStats", authorize, async (req, res) => {
  try {
    const token = req.cookies.BNET_AUTH;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { d2Id } = token;
    if (!d2Id) {
      return res.status(400).json({ error: "No Destiny Membership ID found" });
    }

    // Optional ghost_mod and user_only filters from query params
    const { ghost_mod, user_only } = req.query;

    // Query armor grouped by slot, archetype, and tertiary
    let query = `SELECT
      slot,
      archetype,
      tertiary,
      COUNT(*) as count
    FROM armor a`;

    const params = [];
    const conditions = [];

    // If user_only is true, join with user_loot to filter by user
    if (user_only === "true") {
      query += ` INNER JOIN user_loot ul ON a.instance_id = ul.instance_id`;
      conditions.push("ul.mem_id = ?");
      params.push(d2Id);
    }

    // Handle ghost_mod filtering
    if (ghost_mod === "NONE") {
      // "No Ghost Mod" - show armor without any ghost mod (empty string)
      conditions.push("a.ghost_mod = ?");
      params.push("");
    } else if (ghost_mod) {
      // Specific ghost mod filter
      conditions.push("a.ghost_mod = ?");
      params.push(ghost_mod);
    } else {
      // "All" (default) - show all armor that we polled
      conditions.push("a.ghost_mod IS NOT NULL");
    }

    query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` GROUP BY slot, archetype, tertiary
    ORDER BY slot, archetype, tertiary`;

    const stats = appDb.prepare(query).all(...params);

    // Transform into structured format by slot
    const statsBySlot = stats.reduce(
      (acc, { slot, archetype, tertiary, count }) => {
        if (!acc[slot]) {
          acc[slot] = {};
        }
        if (!acc[slot][archetype]) {
          acc[slot][archetype] = {};
        }
        acc[slot][archetype][tertiary] = count;
        return acc;
      },
      {}
    );

    res.json(statsBySlot);
  } catch (err) {
    console.error("Armor stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

d2.get("/recentArmor", authorize, async (req, res) => {
  try {
    const token = req.cookies.BNET_AUTH;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { d2Id } = token;
    if (!d2Id) {
      return res.status(400).json({ error: "No Destiny Membership ID found" });
    }

    // Query the user's 10 most recent armor drops
    const recentArmor = appDb
      .prepare(
        `SELECT
          a.instance_id,
          a.item_hash,
          a.name,
          a.slot,
          a.archetype,
          a.tertiary,
          a.ghost_mod,
          ul.created_at
        FROM armor a
        INNER JOIN user_loot ul ON a.instance_id = ul.instance_id
        WHERE ul.mem_id = ?
        AND a.ghost_mod IS NOT NULL
        ORDER BY ul.created_at DESC
        LIMIT 10`
      )
      .all(d2Id);

    // Add cached metadata (icon, class, armorSet) to each armor piece
    const enrichedArmor = recentArmor.map((armor) => ({
      ...armor,
      ...armorItemCache[armor.item_hash],
    }));

    res.json(enrichedArmor);
  } catch (err) {
    console.error("Recent armor error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export { d2 };
