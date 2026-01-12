/**
 * Server-side loot polling service
 * Periodically checks for new loot for all connected WebSocket clients
 */

import { storeUserInventoryData } from "./inventory.js";
import {
  armorItemCache,
  archetypeIconUrls,
  statIconUrls,
} from "./definitions.js";
import { broadcastNewLoot } from "./websocket.js";
import { appDb } from "../db.js";

let pollingInterval = null;
let authenticatedClients = null;

/**
 * Initialize the loot poller with authenticated clients
 * @param {Map} clients - Map of WebSocket clients with their auth data
 */
export function initializeLootPoller(clients) {
  authenticatedClients = clients;

  // Start polling every 10 seconds
  if (!pollingInterval) {
    console.log("Starting server-side loot polling service...");
    pollingInterval = setInterval(pollAllConnectedUsers, 10_000);
  }
}

/**
 * Stop the loot polling service
 */
export function stopLootPoller() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("Stopped server-side loot polling service");
  }
}

/**
 * Poll loot for all connected WebSocket clients
 */
async function pollAllConnectedUsers() {
  if (!authenticatedClients || authenticatedClients.size === 0) {
    return;
  }

  // Get unique user IDs from connected clients
  const uniqueUsers = new Map();
  authenticatedClients.forEach((clientData, ws) => {
    if (ws.readyState === 1 && clientData.d2Id) {
      // 1 = OPEN
      uniqueUsers.set(clientData.d2Id, clientData);
    }
  });

  if (uniqueUsers.size === 0) {
    return;
  }

  console.log(`Polling loot for ${uniqueUsers.size} connected user(s)...`);

  // Poll each user
  for (const [d2Id, clientData] of uniqueUsers) {
    try {
      await pollUserLoot(d2Id, clientData.d2Type);
    } catch (err) {
      console.error(`Error polling loot for user ${d2Id}:`, err);
    }
  }
}

/**
 * Poll loot for a specific user
 * @param {string} d2Id - Destiny 2 membership ID
 * @param {number} d2Type - Destiny 2 membership type
 */
async function pollUserLoot(d2Id, d2Type) {
  try {
    // Get username from database
    const userStmt = appDb.prepare("SELECT name FROM users WHERE mem_id = ?;");
    const user = userStmt.get(d2Id);

    if (!user) {
      console.warn(`User ${d2Id} not found in database`);
      return;
    }

    // Get user's access token (we need to store this)
    // For now, we'll need to handle token management differently
    // This is a limitation - we need the access token to poll Bungie API

    // TODO: We need to store and refresh access tokens separately
    // For now, this will only work if we have a way to get the token
    console.warn(`Token management needed for user ${d2Id}`);

  } catch (err) {
    console.error(`Error in pollUserLoot for ${d2Id}:`, err);
  }
}
