const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = [
  // Portrait lock implies this feature as required and drops devices that do not report it.
  'android.hardware.screen.portrait',
  // RECORD_AUDIO implies a required microphone. Playback does not need that filter.
  'android.hardware.microphone',
];

/**
 * Keep screen and hardware features the app can use without making Play hide
 * the release from devices that do not have them.
 */
function withOptionalPortrait(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = manifest['uses-feature'] ?? [];

    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((feature) => feature.$['android:name'] === name);
      if (existing) {
        existing.$['android:required'] = 'false';
      } else {
        features.push({
          $: {
            'android:name': name,
            'android:required': 'false',
          },
        });
      }
    }

    manifest['uses-feature'] = features;
    return config;
  });
}

module.exports = withOptionalPortrait;
