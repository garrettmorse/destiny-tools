# Destiny Tools

A small suite of Destiny 2 web apps, built on the Bungie.net API and self-hosted on a Raspberry Pi. Peak usage reached roughly 2,000 monthly active users.

| App | What it does | Live |
| --- | --- | --- |
| **Edgestats** | Armor stat optimizer: pick armor, mods and tuning, and see the resulting stat spread charted in real time | [garrettmorse.com/edgestats](https://garrettmorse.com/edgestats) |
| **Loot Tracker** | Signs in with Bungie OAuth, polls your inventory for new armor drops, and builds a feed and stat heatmap of what you've earned | [garrettmorse.com/loot](https://garrettmorse.com/loot) |
| **Raidlytics** | Raid history and fireteam statistics for any player | [garrettmorse.com/raidlytics](https://garrettmorse.com/raidlytics) |

## Architecture

```
Browser ──► Express server (Node.js, on a Raspberry Pi)
              ├─ /edgestats, /loot, /raidlytics   static React builds (Vite)
              └─ /api/d2/*                        API layer
                    ├─ Bungie.net Platform API     (API key + OAuth 2.0)
                    ├─ world.content               Destiny manifest, SQLite, auto-updated on version change
                    └─ app.content                 app data, SQLite (users, tracked loot)
```

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express 5, better-sqlite3
- **Auth:** Bungie OAuth 2.0 authorization-code flow with silent token refresh, stored in an httpOnly cookie
- **Manifest handling:** on startup the server compares the local manifest version against Bungie's, then downloads and unpacks the new SQLite database only when it has changed
- **Resilience:** a crash logger keeps a rolling in-memory buffer of recent logs and flushes it to disk on uncaught exceptions

## Running locally

Requires Node.js 20+ and a [Bungie.net application](https://www.bungie.net/en/Application) for an API key and OAuth client.

```bash
cp .env.example .env.dev     # fill in your Bungie credentials
npm install
(cd src/edgestats && npm install)
(cd src/loot && npm install)
(cd src/raidlytics && npm install)
npm run build:all
npm run dev
```

The server listens on port 8080. In production it runs behind a reverse proxy that terminates TLS.

## License

MIT. Destiny 2 content and assets are property of Bungie, Inc. This project is not affiliated with or endorsed by Bungie.
