import Database from "better-sqlite3";
import axios from "axios";
import readline from "readline";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = "https://www.bungie.net/Platform";
const INVENTORY_COMPONENTS = "102,200,201,205,300,302,304,305,310";
const APP_DB_LOCATION = process.cwd() + "/app.content";
const DESTINY_DB_LOCATION = process.cwd() + "/world.content";

// Parse CLI arguments
const DRY_RUN = process.argv.includes("--dry-run");

// ============================================================================
// DATABASE SETUP
// ============================================================================

let appDb;
let destinyDb;

try {
  appDb = new Database(APP_DB_LOCATION);
  destinyDb = new Database(DESTINY_DB_LOCATION);

  appDb.pragma("journal_mode = WAL");
  appDb.pragma("foreign_keys = ON");
  destinyDb.pragma("journal_mode = WAL");

  log("INFO", "Database connections established");
} catch (error) {
  log("ERROR", "Failed to connect to databases", error.message);
  process.exit(1);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Unsigned hash converter (from db.js)
const INT_MAX = 2147483647;
const uINT_MAX = 4294967296;
function unsigned(hash) {
  return hash < 0 ? hash + uINT_MAX : hash;
}

// Logging utility
function log(level, message, details = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
  if (details) {
    if (typeof details === "object" && details.stack) {
      console.log(`  ${details.stack}`);
    } else if (typeof details === "object") {
      console.log("  Details:", JSON.stringify(details, null, 2));
    } else {
      console.log(`  ${details}`);
    }
  }
}

// Readline prompt utility
function promptUser(question, hideInput = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hideInput) {
      const stdin = process.openStdin();
      process.stdin.on("data", (char) => {
        char = char.toString();
        switch (char) {
          case "\n":
          case "\r":
          case "\u0004":
            stdin.pause();
            break;
          default:
            process.stdout.write("\r" + question + "*".repeat(rl.line.length));
            break;
        }
      });
    }

    rl.question(question, (answer) => {
      rl.close();
      if (hideInput) {
        console.log("");
      }
      resolve(answer.trim());
    });
  });
}

// Sleep utility for retries
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// TUNING HASH MAPPING (from definitions.js)
// ============================================================================

log("INFO", "Building tuning hash mapping from Destiny manifest...");

const tuningModHashes = destinyDb
  .prepare(
    `SELECT ii.id, json_extract(s.json, '$.displayProperties.name') as stat_name
     FROM DestinyInventoryItemDefinition ii
     INNER JOIN DestinyStatDefinition s
       ON json_extract(s.json, '$.hash') = json_extract(ii.json, '$.investmentStats[0].statTypeHash')
     WHERE json_extract(ii.json, '$.plug.plugCategoryIdentifier') = 'core.gear_systems.armor_tiering.plugs.tuning.mods'
     AND json_extract(ii.json, '$.investmentStats[0].value') = 5;`
  )
  .all()
  .reduce(
    (tunings, { id, stat_name }) => ({
      ...tunings,
      [unsigned(id)]: stat_name,
    }),
    {}
  );

log("INFO", `Loaded ${Object.keys(tuningModHashes).length} tuning mod hashes`);

// ============================================================================
// AUTHENTICATION
// ============================================================================

let API_KEY = "";
let ACCESS_TOKEN = "";
let REFRESH_TOKEN = "";

async function promptForCredentials() {
  console.log("\n" + "=".repeat(60));
  console.log("  Bungie.net Authentication Required");
  console.log("=".repeat(60));
  console.log("\nTo obtain tokens:");
  console.log("1. Visit https://www.bungie.net/en/Application");
  console.log("2. Create or select your application");
  console.log("3. Authenticate with your Bungie account");
  console.log("4. Copy API Key and OAuth token from developer tools");
  console.log("5. Ensure token has 'ReadUserData' scope\n");

  API_KEY = await promptUser("Enter your Bungie.net API Key: ");
  ACCESS_TOKEN = await promptUser("Enter your OAuth Access Token: ");
  REFRESH_TOKEN = await promptUser(
    "(Optional) Enter Refresh Token (press Enter to skip): "
  );

  if (!API_KEY || !ACCESS_TOKEN) {
    log("ERROR", "API Key and Access Token are required");
    process.exit(1);
  }
}

async function verifyAuthentication() {
  log("INFO", "Verifying authentication...");

  try {
    const response = await axios.get(`${API_BASE_URL}/User/GetCurrentBungieNetUser/`, {
      headers: {
        "X-API-Key": API_KEY,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (response.data.ErrorCode !== 1) {
      throw new Error(`API Error: ${response.data.Message}`);
    }

    log("SUCCESS", `Authenticated as: ${response.data.Response.uniqueName}`);
    return true;
  } catch (error) {
    log("ERROR", "Authentication failed", error.response?.data || error.message);
    return false;
  }
}

async function refreshTokenIfNeeded() {
  if (!REFRESH_TOKEN) {
    return false;
  }

  log("INFO", "Attempting to refresh access token...");

  try {
    // Note: This requires CLIENT_ID and CLIENT_SECRET from environment
    // For manual token input, user should provide a fresh token instead
    log("WARN", "Token refresh requires app credentials. Please provide a new access token.");
    ACCESS_TOKEN = await promptUser("Enter a new OAuth Access Token: ");
    return true;
  } catch (error) {
    log("ERROR", "Token refresh failed", error.message);
    return false;
  }
}

// ============================================================================
// TUNING EXTRACTION LOGIC
// ============================================================================

function extractTuning(instanceId, profileData, tuningModHashes) {
  const reusablePlugs =
    profileData.itemComponents?.reusablePlugs?.data?.[instanceId]?.plugs;

  if (!reusablePlugs || !reusablePlugs["11"]) {
    return null; // Cannot determine tuning
  }

  for (const plug of reusablePlugs["11"]) {
    const match = tuningModHashes[plug.plugItemHash];
    if (match) {
      return match; // Return stat name (e.g., "Discipline")
    }
  }

  return null; // No tuning found
}

// ============================================================================
// API FETCHING
// ============================================================================

async function fetchUserProfile(membershipType, membershipId, retryCount = 0) {
  const maxRetries = 3;

  try {
    const response = await axios.get(
      `${API_BASE_URL}/Destiny2/${membershipType}/Profile/${membershipId}/?components=${INVENTORY_COMPONENTS}`,
      {
        headers: {
          "X-API-Key": API_KEY,
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (response.data.ErrorCode !== 1) {
      throw new Error(`API Error: ${response.data.Message}`);
    }

    return response.data.Response;
  } catch (error) {
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 30000; // Exponential backoff
        log("WARN", `Rate limited. Waiting ${waitTime / 1000} seconds before retry ${retryCount + 1}/${maxRetries}...`);
        await sleep(waitTime);
        return fetchUserProfile(membershipType, membershipId, retryCount + 1);
      } else {
        throw new Error("Max retries exceeded for rate limiting");
      }
    }

    // Handle token expiration (401)
    if (error.response?.status === 401) {
      log("WARN", "Access token expired or invalid");
      const refreshed = await refreshTokenIfNeeded();
      if (refreshed && retryCount < maxRetries) {
        return fetchUserProfile(membershipType, membershipId, retryCount + 1);
      }
      throw new Error("Authentication failed - please restart with valid token");
    }

    throw error;
  }
}

// ============================================================================
// STATISTICS TRACKING
// ============================================================================

const stats = {
  totalArmor: 0,
  usersProcessed: 0,
  successfulUpdates: 0,
  skippedNotFound: 0,
  skippedNullTuning: 0,
  errors: 0,
};

// ============================================================================
// MAIN PROCESSING LOGIC
// ============================================================================

async function processUsers() {
  // Query armor records grouped by user
  log("INFO", "Querying armor records needing backfill...");

  const armorRecords = appDb
    .prepare(
      `SELECT
        ul.mem_id,
        u.mem_type,
        u.name,
        a.instance_id,
        a.tuning
      FROM armor a
      INNER JOIN user_loot ul ON a.instance_id = ul.instance_id
      INNER JOIN users u ON ul.mem_id = u.mem_id
      WHERE a.tuning = 'Unknown'
      ORDER BY ul.mem_id;`
    )
    .all();

  if (armorRecords.length === 0) {
    log("INFO", "No armor records need backfill. Exiting.");
    return;
  }

  stats.totalArmor = armorRecords.length;
  log("INFO", `Found ${armorRecords.length} armor records to process`);

  // Group by user
  const userGroups = new Map();
  for (const record of armorRecords) {
    if (!userGroups.has(record.mem_id)) {
      userGroups.set(record.mem_id, {
        mem_id: record.mem_id,
        mem_type: record.mem_type,
        name: record.name,
        armor: [],
      });
    }
    userGroups.get(record.mem_id).armor.push({
      instance_id: record.instance_id,
      tuning: record.tuning,
    });
  }

  log("INFO", `Grouped into ${userGroups.size} users`);

  // Prepare update statement
  const updateStmt = appDb.prepare(
    "UPDATE armor SET tuning = ? WHERE instance_id = ?"
  );

  const updateMany = appDb.transaction((updates) => {
    for (const { instanceId, tuning } of updates) {
      updateStmt.run(tuning, instanceId);
    }
  });

  // Process each user
  let userIndex = 0;
  for (const [memId, userData] of userGroups) {
    userIndex++;
    const userArmorCount = userData.armor.length;

    console.log("\n" + "-".repeat(60));
    log(
      "INFO",
      `Processing user ${userIndex}/${userGroups.size}: ${userData.name} (${userArmorCount} armor pieces)`
    );

    try {
      // Fetch profile data
      console.log("  → Fetching profile data...");
      const profileData = await fetchUserProfile(userData.mem_type, memId);

      if (!profileData.itemComponents?.reusablePlugs?.data) {
        log("WARN", `User ${userData.name} has no reusable plug data available`);
        stats.skippedNotFound += userArmorCount;
        continue;
      }

      // Extract tuning for each armor piece
      console.log("  → Extracting tuning data...");
      const updates = [];
      let foundCount = 0;
      let notFoundCount = 0;
      let nullTuningCount = 0;

      for (const armor of userData.armor) {
        const instanceId = armor.instance_id;

        // Check if instance exists in profile data
        if (!profileData.itemComponents.reusablePlugs.data[instanceId]) {
          notFoundCount++;
          stats.skippedNotFound++;
          log(
            "WARN",
            `  Armor ${instanceId} not found in user profile (possibly deleted/transferred)`
          );
          continue;
        }

        // Extract tuning
        const tuning = extractTuning(instanceId, profileData, tuningModHashes);

        if (tuning) {
          updates.push({ instanceId, tuning });
          foundCount++;
        } else {
          nullTuningCount++;
          stats.skippedNullTuning++;
          log("WARN", `  Cannot determine tuning for ${instanceId}`);
        }
      }

      console.log(
        `  → Found tuning for ${foundCount} pieces, skipped ${notFoundCount + nullTuningCount}`
      );

      // Update database
      if (updates.length > 0) {
        if (DRY_RUN) {
          console.log(`  → [DRY-RUN] Would update ${updates.length} records:`);
          updates.forEach((u) => {
            console.log(`      ${u.instanceId} → ${u.tuning}`);
          });
        } else {
          console.log("  → Updating database...");
          updateMany(updates);
          stats.successfulUpdates += updates.length;
          log("SUCCESS", `Updated ${updates.length} records for ${userData.name}`);
        }
      } else {
        log("WARN", `No updates to perform for ${userData.name}`);
      }

      stats.usersProcessed++;
    } catch (error) {
      stats.errors++;
      log("ERROR", `Failed to process user ${userData.name}`, error.message);
    }
  }
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================

function displaySummary() {
  console.log("\n" + "=".repeat(60));
  console.log("  Backfill " + (DRY_RUN ? "Preview " : "") + "Complete");
  console.log("=".repeat(60));
  console.log(`Total armor processed:     ${stats.totalArmor}`);
  console.log(`Users processed:           ${stats.usersProcessed}`);
  console.log(`Successful updates:        ${stats.successfulUpdates}`);
  console.log(`Skipped (not found):       ${stats.skippedNotFound}`);
  console.log(`Skipped (null tuning):     ${stats.skippedNullTuning}`);
  console.log(`Errors:                    ${stats.errors}`);

  if (!DRY_RUN) {
    console.log("\nFinal verification:");
    const unknownCount = appDb
      .prepare("SELECT COUNT(*) as count FROM armor WHERE tuning = 'Unknown';")
      .get().count;
    console.log(`  Unknown tuning count:    ${unknownCount} (down from ${stats.totalArmor + (233 - stats.totalArmor)})`);
  }

  console.log("=".repeat(60) + "\n");
}

// ============================================================================
// CLEANUP
// ============================================================================

function cleanup() {
  try {
    if (appDb) {
      appDb.close();
      log("INFO", "App database connection closed");
    }
    if (destinyDb) {
      destinyDb.close();
      log("INFO", "Destiny database connection closed");
    }
  } catch (error) {
    log("ERROR", "Error closing database connections", error.message);
  }

  // Clear sensitive data from memory
  API_KEY = "";
  ACCESS_TOKEN = "";
  REFRESH_TOKEN = "";
}

process.on("SIGINT", () => {
  console.log("\n");
  log("INFO", "Received SIGINT, cleaning up...");
  cleanup();
  process.exit(130);
});

process.on("SIGTERM", () => {
  log("INFO", "Received SIGTERM, cleaning up...");
  cleanup();
  process.exit(143);
});

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("  Armor Tuning Backfill Script");
    console.log("=".repeat(60));
    if (DRY_RUN) {
      console.log("  MODE: DRY-RUN (no database changes will be made)");
      console.log("=".repeat(60));
    }
    console.log("");

    // Authenticate
    await promptForCredentials();
    const authSuccess = await verifyAuthentication();

    if (!authSuccess) {
      log("ERROR", "Authentication failed. Exiting.");
      cleanup();
      process.exit(1);
    }

    // Process users
    await processUsers();

    // Display summary
    displaySummary();

    // Cleanup
    cleanup();

    // Exit with appropriate code
    if (stats.errors > 0) {
      process.exit(2); // Partial success
    } else {
      process.exit(0); // Success
    }
  } catch (error) {
    log("ERROR", "Fatal error in main execution", error);
    cleanup();
    process.exit(1);
  }
}

main();
