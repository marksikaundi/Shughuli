import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const sources = {
  chime: require('../../assets/sounds/shughuli_chime.wav'),
  bell: require('../../assets/sounds/shughuli_bell.wav'),
} as const;

let ready = false;

export async function playCompleteTone(tone: 'none' | 'chime' | 'bell') {
  if (tone === 'none') return;
  try {
    if (!ready) {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      ready = true;
    }
    const player = createAudioPlayer(sources[tone]);
    player.play();
    setTimeout(() => player.release(), 4000);
  } catch {
    // A missing tone should not block completing a task.
  }
}
