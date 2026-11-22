const sources = {
  chime: require('../../assets/sounds/shughuli_chime.wav'),
  bell: require('../../assets/sounds/shughuli_bell.wav'),
} as const;

let ready = false;

export async function playCompleteTone(tone: 'none' | 'chime' | 'bell') {
  if (tone === 'none') return;
  try {
    const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
    if (!ready) {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      ready = true;
    }
    const player = createAudioPlayer(sources[tone]);
    player.play();
    setTimeout(() => player.release(), 4000);
  } catch {
    // This dev build does not include Expo Audio yet. Completing a task still works.
  }
}
