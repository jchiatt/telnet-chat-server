import fs from "fs";
import { ChatServerConfig } from "../types";

export const setupLogging = (config: ChatServerConfig) => {
  const appLog = fs.createWriteStream(config.logFiles.app, { flags: "a" });
  const errLog = fs.createWriteStream(config.logFiles.error, { flags: "a" });

  // @ts-expect-error
  process.stdout.write = appLog.write.bind(appLog);
  // @ts-expect-error
  process.stderr.write = errLog.write.bind(errLog);
};
