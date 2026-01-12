/**
 * WebSocket broadcasting service
 * Handles broadcasting loot updates and stats to connected clients
 */

let wss = null;
let authenticatedClients = null;

/**
 * Initialize the WebSocket service with the server instance
 * @param {import('ws').WebSocketServer} wsServer
 * @param {Map} clients
 */
export function initializeWebSocketService(wsServer, clients) {
  wss = wsServer;
  authenticatedClients = clients;
}

/**
 * Broadcast new loot to a specific user
 * @param {string} d2Id - Destiny 2 membership ID
 * @param {Array} newArmor - Array of new armor pieces
 */
export function broadcastNewLoot(d2Id, newArmor) {
  if (!wss || !authenticatedClients) {
    console.warn("WebSocket service not initialized");
    return;
  }

  let sentCount = 0;
  authenticatedClients.forEach((clientData, ws) => {
    if (clientData.d2Id === d2Id && ws.readyState === 1) {
      // 1 = OPEN
      ws.send(
        JSON.stringify({
          type: "newLoot",
          data: newArmor,
        })
      );
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`Broadcasted ${newArmor.length} new armor pieces to ${sentCount} client(s) for user ${d2Id}`);
  }
}

/**
 * Broadcast armor stats update to all connected clients
 * @param {Object} stats - Armor statistics
 */
export function broadcastArmorStats(stats) {
  if (!wss || !authenticatedClients) {
    console.warn("WebSocket service not initialized");
    return;
  }

  const message = JSON.stringify({
    type: "armorStats",
    data: stats,
  });

  let sentCount = 0;
  authenticatedClients.forEach((clientData, ws) => {
    if (ws.readyState === 1) {
      // 1 = OPEN
      ws.send(message);
      sentCount++;
    }
  });

  console.log(`Broadcasted armor stats to ${sentCount} client(s)`);
}
