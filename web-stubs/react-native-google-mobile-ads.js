// react-native-google-mobile-ads has no web build path at all (pure native SDK wrapper).
// metro.config.js redirects it to this stub only for platform=web, so Metro can bundle the
// web build instead of failing to resolve the package's native-only internals. `null` here
// matches exactly what src/ads/AdMobManager.ts already does when require() throws on a
// platform without the native module (e.g. Expo Go) — same "ads unavailable" code path.
module.exports = null;
