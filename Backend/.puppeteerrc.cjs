const { join } = require('path');

/**
 * Puppeteer config — stores the Chrome binary inside the project directory
 * so it survives Render's build cache and is available at runtime.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
