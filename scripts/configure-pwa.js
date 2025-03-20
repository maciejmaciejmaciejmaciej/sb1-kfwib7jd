const fs = require('fs');
const path = require('path');

// Read PWA configuration
const pwaConfig = require('../pwa/config.json');

// Read existing app.json
const appJsonPath = path.join(__dirname, '../app.json');
const appJson = require(appJsonPath);

// Validate required paths exist
const validatePath = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  return true;
};

// Validate all required assets exist
try {
  validatePath(pwaConfig.icons.favicon);
  validatePath(pwaConfig.icons.pwa["192"]);
  validatePath(pwaConfig.icons.pwa["512"]);
  validatePath(pwaConfig.icons.splash.image);
} catch (error) {
  console.error('Error validating PWA assets:', error.message);
  process.exit(1);
}

// Update web configuration
appJson.expo.web = {
  ...appJson.expo.web,
  bundler: "metro",
  output: "single",
  favicon: pwaConfig.icons.favicon,
  name: pwaConfig.app.name,
  shortName: pwaConfig.app.shortName,
  description: pwaConfig.app.description,
  lang: pwaConfig.app.lang,
  themeColor: pwaConfig.app.themeColor,
  backgroundColor: pwaConfig.app.backgroundColor,
  startUrl: pwaConfig.web.startUrl,
  display: pwaConfig.web.display,
  orientation: pwaConfig.web.orientation,
  icons: [
    {
      src: pwaConfig.icons.pwa["192"],
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: pwaConfig.icons.pwa["512"],
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ],
  splash: {
    image: pwaConfig.icons.splash.image,
    resizeMode: pwaConfig.icons.splash.resizeMode,
    backgroundColor: pwaConfig.icons.splash.backgroundColor
  }
};

// Write updated app.json
try {
  fs.writeFileSync(
    appJsonPath,
    JSON.stringify(appJson, null, 2),
    'utf8'
  );
  console.log('✅ PWA configuration updated successfully!');
} catch (error) {
  console.error('Error writing app.json:', error.message);
  process.exit(1);
}