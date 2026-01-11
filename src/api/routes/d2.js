import { Router } from "express";
import { apiClient, apiGet, apiPost } from "../client.js";
import { appDb, destinyDb } from "../db.js";
import {
  fetchAllRaidActivities,
  fetchPGCR,
  gatherFireteamRaidStats,
} from "../util.js";
import { authorize } from "../auth.js";
import CONSTANTS from "../constants.js";
import { storeUserInventoryData } from "../services/inventory.js";
import {
  archetypeIconUrls,
  armorItemCache,
  statIconUrls,
} from "../services/definitions.js";
import {
  getAllRaids,
  validateRaidIds,
  findRelevantRaidActivities,
} from "../services/raids.js";

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
  try {
    const raids = getAllRaids();
    return res.json(raids);
  } catch (err) {
    console.error("Error fetching raids:", err);
    return res.status(500).json(CONSTANTS.ERRORS[500]);
  }
});

d2.get("/aggregateRaids", async (req, res) => {
  const { raidIds, userId } = req.query;
  if (!raidIds) {
    return res.status(400).json({ error: 'Missing "raidIds" query parameter' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'Missing "userId" query parameter' });
  }
  if (typeof userId !== "string") {
    return res.status(400).json({ error: '"userId" must be a string.' });
  }

  const raidIdArr = raidIds.split(",");

  // Validate raid IDs
  const validation = validateRaidIds(raidIdArr);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  const raidName = validation.raidName;

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

  // Find relevant raid activities
  const result = findRelevantRaidActivities(allRaidActivities, raidIdArr);
  if (result.error) {
    return res.status(409).json({
      error: `No completions on record for "${raidName}".`,
    });
  }

  const { relevantRaids } = result;

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

    // Add cached metadata (icon, class, armorSet) to each armor piece
    // and archetype with icon URL
    const enrichedArmor = newArmor.map((armor) => ({
      ...armor,
      ...armorItemCache[armor.item_hash],
      archetypeUrl: archetypeIconUrls[armor.archetype],
      tertiaryUrl: statIconUrls[armor.tertiary],
      tuningUrl: statIconUrls[armor.tuning] ?? null,
    }));
    res.json({ new: enrichedArmor });
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

    // Calculate "All Armor" aggregate across all slots
    const allArmor = stats.reduce((acc, { archetype, tertiary, count }) => {
      if (!acc[archetype]) {
        acc[archetype] = {};
      }
      if (!acc[archetype][tertiary]) {
        acc[archetype][tertiary] = 0;
      }
      acc[archetype][tertiary] += count;
      return acc;
    }, {});

    res.json({
      "All Armor": allArmor,
      ...statsBySlot,
    });
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
          a.tuning,
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
    // and archetype with icon URL
    const enrichedArmor = recentArmor.map((armor) => ({
      ...armor,
      ...armorItemCache[armor.item_hash],
      archetypeUrl: archetypeIconUrls[armor.archetype],
      tertiaryUrl: statIconUrls[armor.tertiary],
      tuningUrl: statIconUrls[armor.tuning] ?? null,
    }));
    res.json(enrichedArmor);
  } catch (err) {
    console.error("Recent armor error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export { d2 };
