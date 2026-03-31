const dotenv = require('dotenv');

dotenv.config();

const requiredVars = ['PORT', 'FRONTEND_URL', 'MONGODB_URI'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    // Keep startup strict so missing env is caught early.
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: Number(process.env.PORT),
  frontendUrl: process.env.FRONTEND_URL,
  mongoUri: process.env.MONGODB_URI,
};
