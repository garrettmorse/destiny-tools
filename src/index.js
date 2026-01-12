import express from "express";
import "dotenv/config";
import "./crashLogger.js";
import { d2 } from "./api/routes/d2.js";
import path from "node:path";
import fs from "node:fs";
import https from "https";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { parse as parseCookie } from "cookie";
import { initializeWebSocketService } from "./api/services/websocket.js";

const port = 8080;

// const key = fs.readFileSync("localhost-key.pem", { encoding: "utf8" });
// const cert = fs.readFileSync("localhost.pem", { encoding: "utf8" });
// const passphrase = process.env.CERT_PASSPHRASE;
// const credentials = { key, passphrase, cert };

const app = express();
// const httpsServer = https.createServer(credentials, app);

// function ensureSecure(req, res, next) {
//   if (req.secure) {
//     return next();
//   }

//   res.redirect("https://" + req.hostname + req.originalUrl);
// }

// app.use(ensureSecure);

if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: "https://localhost:5173", credentials: true }));
}

const __dirname = import.meta.dirname;

app.use(cookieParser());

app.use("/api/d2", d2);

app.disable("x-powered-by");

app.set("trust proxy", "process.env.TRUSTED_PROXY");

app.use(
  "/raidlytics",
  express.static("dist/raidlytics", { extensions: ["html"] })
);

app.use(
  "/edgestats",
  express.static("dist/edgestats", { extensions: ["html"] })
);

app.use("/loot", express.static("dist/loot", { extensions: ["html"] }));

const server = app.listen(port, () =>
  console.log(`server listening on ${port}`)
);

// WebSocket Server
const wss = new WebSocketServer({ server });

// Store authenticated connections with user metadata
const authenticatedClients = new Map();

wss.on("connection", (ws, req) => {
  console.log("WebSocket connection attempt");

  // Parse cookies from the connection request
  const cookies = req.headers.cookie ? parseCookie(req.headers.cookie) : {};
  const authCookie = cookies.BNET_AUTH;

  if (!authCookie) {
    console.log("WebSocket connection rejected: No auth cookie");
    ws.close(1008, "Not authenticated");
    return;
  }

  try {
    // Parse the auth token
    // Express serializes JSON cookies with 'j:' prefix
    let token;
    let cookieValue = authCookie;

    // Check if it's a JSON-encoded cookie (Express adds 'j:' prefix)
    if (cookieValue.startsWith("j:")) {
      cookieValue = cookieValue.slice(2); // Remove 'j:' prefix
    }

    // Try to parse as JSON
    try {
      token = JSON.parse(decodeURIComponent(cookieValue));
    } catch (e) {
      // If that fails, try without decoding
      token = JSON.parse(cookieValue);
    }

    if (!token.d2Id) {
      console.log("WebSocket connection rejected: Invalid token");
      ws.close(1008, "Invalid authentication");
      return;
    }

    // Store authenticated connection
    const clientId = token.d2Id;
    authenticatedClients.set(ws, { d2Id: clientId, d2Type: token.d2Type });

    console.log(`WebSocket client authenticated: ${clientId}`);

    // Send welcome message
    ws.send(
      JSON.stringify({ type: "connected", message: "WebSocket connected" })
    );

    // Handle incoming messages from client
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle "checkLoot" request from client
        if (data.type === "checkLoot") {
          // Import the modules we need
          const { storeUserInventoryData } = await import(
            "./api/services/inventory.js"
          );
          const { armorItemCache, archetypeIconUrls, statIconUrls } =
            await import("./api/services/definitions.js");
          const { appDb } = await import("./api/db.js");

          // Get username
          const userStmt = appDb.prepare(
            "SELECT name FROM users WHERE mem_id = ?;"
          );
          const user = userStmt.get(token.d2Id);

          if (!user) {
            ws.send(
              JSON.stringify({ type: "error", message: "User not found" })
            );
            return;
          }

          // Check for new armor
          const newArmor = await storeUserInventoryData(
            user.name,
            token.d2Id,
            token.d2Type,
            token.access_token,
            true
          );

          // Enrich armor data
          const enrichedArmor = newArmor.map((armor) => ({
            ...armor,
            ...armorItemCache[armor.item_hash],
            archetypeUrl: archetypeIconUrls[armor.archetype],
            tertiaryUrl: statIconUrls[armor.tertiary],
            tuningUrl: statIconUrls[armor.tuning] ?? null,
          }));

          // Send back to this client and broadcast to all connected clients for this user
          if (enrichedArmor.length > 0) {
            const { broadcastNewLoot } = await import(
              "./api/services/websocket.js"
            );
            broadcastNewLoot(token.d2Id, enrichedArmor);
          }
        }
      } catch (err) {
        console.error("WebSocket message handling error:", err);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to process request",
          })
        );
      }
    });

    ws.on("close", () => {
      authenticatedClients.delete(ws);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      authenticatedClients.delete(ws);
    });
  } catch (err) {
    console.error("WebSocket auth error:", err);
    ws.close(1008, "Authentication failed");
  }
});

// Initialize WebSocket service for broadcasting
initializeWebSocketService(wss, authenticatedClients);

app.get("/", (_, res) => res.send("hey"));

app.get("/raidlytics*none", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "dist/raidlytics", "index.html"));
});

app.get("/edgestats*none", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "dist/edgestats", "index.html"));
});

app.get("/loot*none", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "dist/loot", "index.html"));
});
