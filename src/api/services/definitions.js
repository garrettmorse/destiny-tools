import { destinyDb, getDefinition, unsigned } from "../db.js";

/**
 * Cached armor archetype hashes
 * @type {{ [hash: string]: string }}
 */
export const armorArchetypeHashes = destinyDb
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

/**
 * Archetype name to primary/secondary stat mapping
 */
export const archetypeStatMapping = {
  Specialist: { primary: "Class", secondary: "Weapons" },
  Gunner: { primary: "Weapons", secondary: "Grenade" },
  Bulwark: { primary: "Health", secondary: "Class" },
  Grenadier: { primary: "Grenade", secondary: "Super" },
  Paragon: { primary: "Super", secondary: "Melee" },
  Brawler: { primary: "Melee", secondary: "Health" },
};

/**
 * Cached armor bucket hashes
 * @type {{ [hash: string]: string }}
 */
export const armorBucketHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') as bucket FROM DestinyInventoryBucketDefinition WHERE json_extract(json, '$.index') > 2 AND json_extract(json, '$.index') < 8;"
  )
  .all()
  .reduce(
    (buckets, { id, bucket }) => ({ ...buckets, [unsigned(id)]: bucket }),
    {}
  );

/**
 * Cached weapon bucket hashes
 * @type {{ [hash: string]: string }}
 */
export const weaponBucketHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') as bucket FROM DestinyInventoryBucketDefinition WHERE json_extract(json, '$.index') > -1 AND json_extract(json, '$.index') < 3;"
  )
  .all()
  .reduce(
    (buckets, { id, bucket }) => ({ ...buckets, [unsigned(id)]: bucket }),
    {}
  );

/**
 * Ghost bucket hash
 * @type {string}
 */
export const ghostBucketHash = unsigned(
  destinyDb
    .prepare(
      "SELECT id FROM DestinyInventoryBucketDefinition WHERE json_extract(json, '$.displayProperties.name') = 'Ghost'"
    )
    .get().id
);

/**
 * Armor stat hashes
 * @type {{ [hash: string]: string }}
 */
export const armorStatHashes = destinyDb
  .prepare(
    "SELECT id, json_extract(json, '$.displayProperties.name') AS stat FROM DestinyStatDefinition WHERE json_extract(json, '$.statCategory') = 2;"
  )
  .all()
  .reduce((stats, { id, stat }) => ({ ...stats, [unsigned(id)]: stat }), {});

/**
 * Cached ghost economic mod hashes (Armorer mods)
 * @type {{ [hash: string]: string }}
 */
export const ghostEconomicModHashes = destinyDb
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

/**
 * Cache armor item metadata (icon, class, armor set name) by item hash
 * @type {{ [hash: number]: { icon: string; class: string; armorSet: string | null }}}
 */
export const armorItemCache = {};

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

/**
 * Get raid activity type hash
 * @returns {number}
 */
export function getRaidActivityTypeHash() {
  return destinyDb
    .prepare(
      "SELECT id FROM DestinyActivityTypeDefinition WHERE json_extract(json, '$.displayProperties.name') = 'Raid'"
    )
    .get().id;
}
