import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PIN_KEY = 'shughuli.pin';

export type BiometricKind = 'none' | 'face' | 'fingerprint' | 'biometric';

export async function biometricKind(): Promise<BiometricKind> {
  if (Platform.OS === 'web') return 'none';

  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) return 'none';
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    return 'biometric';
  } catch {
    return 'none';
  }
}

export async function unlockWithBiometrics() {
  if (Platform.OS === 'web') return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Shughuli',
      cancelLabel: 'Use PIN',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function hasPin() {
  return (await readPinHash()) != null;
}

export async function savePin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error('Use a 4-digit PIN.');
  const hash = await hashPin(pin);
  if (Platform.OS === 'web') throw new Error('App lock is available on iPhone and Android.');
  await SecureStore.setItemAsync(PIN_KEY, hash, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function checkPin(pin: string) {
  const current = await readPinHash();
  if (!current) return false;
  return (await hashPin(pin)) === current;
}

export async function clearPin() {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
  } catch {
    // The PIN may already be gone.
  }
}

async function readPinHash() {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
}

function hashPin(pin: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `shughuli-pin-v1:${pin}`);
}
