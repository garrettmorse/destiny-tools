import express from "express";
import "dotenv/config";
import "./crashLogger.js";
import { d2 } from "./api/routes/d2.js";
import path from "node:path";
import fs from "node:fs";
import https from "https";
import cors from "cors";
import cookieParser from "cookie-parser";

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

app.listen(port, () => console.log(`server listening on ${port}`));

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
