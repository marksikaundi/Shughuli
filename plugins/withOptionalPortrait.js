const { withAndroidManifest } = require('expo/config-plugins');

const PORTRAIT_FEATURE = 'android.hardware.screen.portrait';

/**
 * `orientation: "portrait"` sets android:screenOrientation on the activity.
 * Android then implies android.hardware.screen.portrait as required, and Play
 * blocks phones, tablets, desktops, and Android XR that do not report it.
 * An explicit required="false" keeps the portrait lock without that filter.
 */
function withOptionalPortrait(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = manifest['uses-feature'] ?? [];
    const existing = features.find((feature) => feature.$['android:name'] === PORTRAIT_FEATURE);

    if (existing) {
      existing.$['android:required'] = 'false';
    } else {
      features.push({
        $: {
          'android:name': PORTRAIT_FEATURE,
          'android:required': 'false',
        },
      });
    }

    manifest['uses-feature'] = features;
    return config;
  });
}

module.exports = withOptionalPortrait;
