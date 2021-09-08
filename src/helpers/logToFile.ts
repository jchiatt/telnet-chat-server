import fs from "fs";

export const setupLogging = () => {
  const appLog = fs.createWriteStream(process.cwd() + "/logs/app.log", { flags: "a" });
  const errLog = fs.createWriteStream(process.cwd() + "/logs/./err.log", { flags: "a" });

  // @ts-expect-error
  process.stdout.write = appLog.write.bind(appLog);
  // @ts-expect-error
  process.stderr.write = errLog.write.bind(errLog);
};
