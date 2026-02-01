type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

class Logger {
  private logLevel: LogLevel = (process.env.LOG_LEVEL ||
    "info") as LogLevel;

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, metadata?: unknown) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(metadata && typeof metadata === "object" ? { metadata } : {}),
    };

    // MCP servers must write logs to stderr, not stdout
    process.stderr.write(this.format(entry) + "\n");
  }

  debug(message: string, metadata?: unknown) {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: unknown) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: unknown) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: unknown) {
    this.log("error", message, metadata);
  }
}

export const logger = new Logger();
