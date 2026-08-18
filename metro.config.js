// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const config = getDefaultConfig(__dirname);

// Native-only packages with no web build path at all get redirected to a stub for
// platform=web, so the web bundle can resolve instead of crashing on their native internals.
// (AdMobManager.ts already treats require() returning null the same as "unavailable".)
const WEB_STUB_MODULES = {
  'react-native-google-mobile-ads': path.resolve(__dirname, 'web-stubs/react-native-google-mobile-ads.js'),
};

const { resolveRequest: defaultResolveRequest } = config.resolver;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUB_MODULES[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_STUB_MODULES[moduleName] };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
