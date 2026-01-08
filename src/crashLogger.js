import fs from "node:fs";
import path from "node:path";

class CrashLogger {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.logBuffer = [];
    this.logDir = options.logDir || "logs";
    this.crashLogFile = path.join(this.logDir, "crash.log");
    this.fullLogFile = path.join(this.logDir, "server.log");

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Create write stream for full logs
    this.logStream = fs.createWriteStream(this.fullLogFile, { flags: "a" });

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    this.interceptConsole();
    this.setupCrashHandlers();

    // Periodically flush the crash log (every 30 seconds)
    this.flushInterval = setInterval(() => {
      this.writeCrashLog();
    }, 30000);
  }

  formatLogEntry(level, args) {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      )
      .join(" ");
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  addToBuffer(level, args) {
    const entry = this.formatLogEntry(level, args);

    // Add to circular buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxEntries) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Write to full log file
    this.logStream.write(entry + "\n");

    return entry;
  }

  interceptConsole() {
    console.log = (...args) => {
      this.addToBuffer("log", args);
      this.originalConsole.log.apply(console, args);
    };

    console.error = (...args) => {
      this.addToBuffer("error", args);
      this.originalConsole.error.apply(console, args);
    };

    console.warn = (...args) => {
      this.addToBuffer("warn", args);
      this.originalConsole.warn.apply(console, args);
    };

    console.info = (...args) => {
      this.addToBuffer("info", args);
      this.originalConsole.info.apply(console, args);
    };
  }

  writeCrashLog() {
    try {
      const crashLogContent = this.logBuffer.join("\n");
      fs.writeFileSync(this.crashLogFile, crashLogContent);
    } catch (error) {
      this.originalConsole.error("Failed to write crash log:", error);
    }
  }

  setupCrashHandlers() {
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.addToBuffer("error", ["UNCAUGHT EXCEPTION:", error.stack || error]);
      this.writeCrashLog();

      this.originalConsole.error("Uncaught Exception:", error);

      // Give time for log to write, then exit
      setTimeout(() => {
        process.exit(1);
      }, 100);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      this.addToBuffer("error", [
        "UNHANDLED REJECTION:",
        reason?.stack || reason,
        "at promise:",
        promise,
      ]);
      this.writeCrashLog();

      this.originalConsole.error("Unhandled Rejection:", reason);
    });

    // Handle graceful shutdown
    const shutdown = (signal) => {
      this.addToBuffer("info", [`Received ${signal}, shutting down gracefully...`]);
      this.writeCrashLog();

      clearInterval(this.flushInterval);
      this.logStream.end();

      setTimeout(() => {
        process.exit(0);
      }, 100);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  destroy() {
    clearInterval(this.flushInterval);
    this.logStream.end();

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
  }
}

// Export singleton instance
export const crashLogger = new CrashLogger({ maxEntries: 1000 });
