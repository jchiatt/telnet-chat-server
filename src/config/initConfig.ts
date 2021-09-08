import path from "path";
export const initConfig = () => {
  const configPath = path.resolve(`src/config/chat.config.ts`);
  const config = require(configPath).default;
  return config;
};
