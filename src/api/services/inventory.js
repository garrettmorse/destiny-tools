import { apiClient } from "../client.js";
import { appDb, getDefinition } from "../db.js";
import {
  armorArchetypeHashes,
  archetypeStatMapping,
  armorBucketHashes,
  ghostBucketHash,
  armorStatHashes,
  ghostEconomicModHashes,
  armorItemCache,
} from "./definitions.js";

/**
 * Component types for fetching full inventory
 * 102: Vault
 * 200: Characters (needed for character IDs in inventories)
 * 201: CharacterInventories (non-equipped on chars)
 * 205: CharacterEquipment (equipped)
 * 300: ItemInstances (instance data like gearTier, damage type, etc.)
 * 302: ProfileCurrencies
 * 304: ItemStats (stat values for items)
 * 305: ItemSockets (socket and plug data for items)
 */
const INVENTORY_COMPONENTS = "102,200,201,205,300,302,304,305";

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
 * Fetch full inventory from Bungie API
 * @param {string} membershipType
 * @param {string} membershipId
 * @param {string} accessToken
 * @returns {Promise<ProfileResponse>}
 */
export async function fetchFullInventory(
  membershipType,
  membershipId,
  accessToken
) {
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
 * Extract all instance IDs from profile data
 * @param {ProfileData} data
 * @returns {number[]}
 */
export function extractInstanceIds(data) {
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
 * Extract armor from profile data
 * @param {ProfileData} data
 * @param {boolean} [isPolling=false] - Whether to extract ghost armorer mod (only during polling)
 * @returns {Armor[]}
 */
export function extractArmor(data, isPolling = false) {
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

/**
 * Store user inventory data in the database
 * @param {string} username
 * @param {string} d2Id
 * @param {string} accountType
 * @param {string} accessToken
 * @param {boolean} isPolling
 * @returns {Promise<Armor[]>} Array of new armor pieces
 */
export async function storeUserInventoryData(
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
