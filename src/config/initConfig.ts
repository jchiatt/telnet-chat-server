import path from "path";
export const initConfig = () => {
  const configPath = path.resolve(`src/config/chat.config.js`);
  const config = require(configPath);
  return config;
};
