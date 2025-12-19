import Database from "better-sqlite3";
import { rm, rename, writeFile, stat, readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { apiClient, apiGet } from "./client.js";
import AdmZip from "adm-zip";
const DESTINY_DB_LOCATION = process.cwd() + "/world.content";
const APP_DB_LOCATION = process.cwd() + "/app.content";
const TMP_ZIP_LOCATION = process.cwd() + "/world.zip";
const VERSION_LOCATION = process.cwd() + "/.db_version";
let destinyDb;

async function updateManifestIfNeeded() {
  try {
    const [manifestErr, manifest] = await apiGet("/Destiny2/Manifest");
    if (manifestErr) {
      throw new Error("Failed to retrieve Destiny 2 Manifest: ", manifestErr);
    }

    const latestManifestVersion = manifest.Response.version;
    let localVersion = null;
    try {
      localVersion = await readFile(VERSION_LOCATION, { encoding: "utf-8" });
    } catch {
      // no local version yet
    }

    if (
      localVersion === latestManifestVersion &&
      (await stat(DESTINY_DB_LOCATION))
    ) {
      console.log("Manifest up-to-date!");
      return DESTINY_DB_LOCATION;
    }

    console.log("Updating Manifest...");
    const writer = createWriteStream(TMP_ZIP_LOCATION);
    const response = await apiClient.get(
      manifest.Response.mobileWorldContentPaths.en,
      {
        responseType: "stream",
      }
    );
    if (response.status !== 200) {
      throw new Error("Failed to retrieve Destiny 2 DB: ", response);
    }

    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    const zip = AdmZip(TMP_ZIP_LOCATION);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      throw new Error("Destiny 2 Manifest DB zip is empty");
    }
    const dbEntry = entries[0];
    zip.extractEntryTo(dbEntry, process.cwd(), false, true);
    await rename(`${process.cwd()}/${dbEntry.entryName}`, DESTINY_DB_LOCATION);
    await rm(TMP_ZIP_LOCATION);
    await writeFile(VERSION_LOCATION, latestManifestVersion);
  } catch (error) {
    console.error("Manifest update failed:", error.message);
    if (await stat(DESTINY_DB_LOCATION)) {
      return;
    }
    throw error;
  }
}

await updateManifestIfNeeded();
destinyDb = new Database(DESTINY_DB_LOCATION);
const appDb = new Database(APP_DB_LOCATION);
destinyDb.pragma("journal_mode = WAL");
appDb.pragma("journal_mode = WAL");
appDb.pragma("foreign_keys = ON");
appDb
  .prepare(
    "CREATE TABLE IF NOT EXISTS users (mem_id VARCHAR(32) PRIMARY KEY, mem_type INT NOT NULL, name VARCHAR(64) NOT NULL);"
  )
  .run();
appDb
  .prepare(
    "CREATE TABLE IF NOT EXISTS user_loot (instance_id VARCHAR(32) PRIMARY KEY, mem_id VARCHAR(32) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (mem_id) REFERENCES users(mem_id));"
  )
  .run();
appDb
  .prepare(
    "CREATE TABLE IF NOT EXISTS armor (instance_id VARCHAR(32) PRIMARY KEY, item_hash INT NOT NULL, name VARCHAR(64) NOT NULL, slot VARCHAR(16) NOT NULL, archetype VARCHAR(16) NOT NULL, tertiary VARCHAR(16) NOT NULL, ghost_mod VARCHAR(16), FOREIGN KEY (instance_id) REFERENCES user_loot(instance_id));"
  )
  .run();
appDb
  .prepare(
    "CREATE TABLE IF NOT EXISTS weapons (instance_id VARCHAR(32) PRIMARY KEY, item_hash INT NOT NULL, name VARCHAR(64) NOT NULL, perk1 VARCHAR(32) NOT NULL, perk2 VARCHAR(32) NOT NULL, perk3 VARCHAR(32) NOT NULL, perk4 VARCHAR(32) NOT NULL, perk5 VARCHAR(32) NOT NULL, perk6 VARCHAR(32) NOT NULL, FOREIGN KEY (instance_id) REFERENCES user_loot(instance_id));"
  )
  .run();

// NOTE: destiny hashes are unsigned 32-bit, so we must convert when id > 2^31 - 1
const INT_MAX = 2147483647;
const uINT_MAX = 4294967296;
function signed(hash) {
  return hash > INT_MAX ? hash - uINT_MAX : hash;
}

function unsigned(hash) {
  return hash < 0 ? hash + uINT_MAX : hash;
}

/**
 *
 * @param {"ArtDyeChannel" | "ArtDyeReference" | "Place" | "Activity" | "ActivityType" | "Class" | "Gender" | "InventoryBucket" | "Race" | "Unlock" | "StatGroup" | "ProgressionMapping" | "Faction" | "VendorGroup" | "RewardSource" | "UnlockValue" | "RewardMapping" | "ItemCategory" | "DamageType" | "ActivityMode" | "MedalTier" | "Achievement" | "ActivityDifficultyTierCollection" | "ActivityFamily" | "ActivityGraph" | "ActivityInteractable" | "ActivityLoadoutRestriction" | "ActivitySelectableSkullCollection" | "ActivitySelectableSkullExclusionGroup" | "ActivitySkullCategory" | "ActivitySkullCollection" | "ActivitySkullSubcategory" | "Bond" | "CharacterCustomizationCategory" | "CharacterCustomizationOption" | "Collectible" | "Destination" | "EntitlementOffer" | "EquipableItemSet" | "EquipmentSlot" | "EventCard" | "FireteamFinderActivityGraph" | "FireteamFinderActivitySet" | "FireteamFinderLabel" | "FireteamFinderLabelGroup" | "FireteamFinderOption" | "FireteamFinderOptionGroup" | "Icon" | "Stat" | "InventoryItem" | "InventoryItemLite" | "ItemFilter" | "ItemTierType" | "LoadoutColor" | "LoadoutIcon" | "LoadoutName" | "Location" | "Lore" | "MaterialRequirementSet" | "Metric" | "Objective" | "SandboxPerk" | "PlatformBucketMapping" | "PlugSet" | "PowerCap" | "PresentationNode" | "Progression" | "ProgressionLevelRequirement" | "Record" | "RewardAdjusterPointer" | "RewardAdjusterProgressionMap" | "RewardItemList" | "SackRewardItemList" | "SandboxPattern" | "Season" | "SeasonPass" | "SocialCommendation" | "SocketCategory" | "SocketType" | "Trait" | "UnlockCountMapping" | "UnlockEvent" | "UnlockExpressionMapping" | "Vendor" | "Milestone" | "ActivityModifier" | "ReportReasonCategory" | "Artifact" | "BreakerType" | "Checklist" | "EnergyType" | "SocialCommendationNode" | "GuardianRank" | "GuardianRankConstants" | "LoadoutConstants" | "FireteamFinderConstants" | "GlobalConstants" | "InventoryItemConstants"} category
 * @param {number} hash
 */
function getDefinition(category, hash) {
  const id = signed(hash);
  const row = destinyDb
    .prepare(`SELECT json FROM Destiny${category}Definition WHERE id = ?`)
    .get(id);
  return row ? JSON.parse(row.json) : null;
}

export { appDb, destinyDb, getDefinition, signed, unsigned };
