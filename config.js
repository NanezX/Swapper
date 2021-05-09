// config.js
const dotenv = require('dotenv').config();

module.exports = {
  ALCHEMY_KEY: process.env.ALCHEMY_KEY || 'development',
}