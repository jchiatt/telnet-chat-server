import fs from "fs";
import { ChatServerConfig } from "../types";
import console, { Console } from "console";

const pristineConsoleLog = console.log;

export const setupLogging = (config: ChatServerConfig) => {
  const appLog = fs.createWriteStream(config.logFiles.app, { flags: "a" });
  const errLog = fs.createWriteStream(config.logFiles.error, { flags: "a" });

  // make a new logger with stdout and stderr pointed to new write streams
  const logger = new Console({
    stdout: appLog,
    stderr: errLog,
  });

  // monkeypatch console.log (in practice, I'd use a more sophisticated logging solution like log4)
  console.log = function (str) {
    pristineConsoleLog(str);
    logger.log(str);
  };
};
