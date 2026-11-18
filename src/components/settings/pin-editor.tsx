import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { PinPad } from '@/components/settings/pin-pad';
import { settingsStyles } from '@/components/settings/page';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { checkPin, savePin } from '@/lib/app-lock';
import { useCopy } from '@/lib/settings-copy';

export function PinEditor({
  visible,
  mode,
  onClose,
  onSaved,
}: {
  visible: boolean;
  mode: 'create' | 'change';
  onClose: () => void;
  onSaved: () => void;
}) {
  const text = useCopy();
  const theme = useSettingsTheme();
  const [step, setStep] = useState<'verify' | 'create' | 'confirm'>(mode === 'change' ? 'verify' : 'create');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const title = step === 'verify' ? text.currentPin : step === 'confirm' ? text.confirmPin : text.choosePin;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setStep(mode === 'change' ? 'verify' : 'create');
        setFirst('');
        setError('');
        setAttempt(0);
      }}>
      <View style={[settingsStyles.pinScreen, { backgroundColor: theme.dark ? theme.colors.canvas : '#FBF6F3' }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={onClose} style={settingsStyles.pinClose}>
          <Icon name="close" size={18} color={theme.colors.ink} />
        </Pressable>
        <PinPad
          key={`${step}-${attempt}`}
          title={text.appLock}
          subtitle={title}
          error={error}
          onSubmit={(pin) => {
            if (step === 'verify') {
              void checkPin(pin).then((ok) => {
                if (!ok) {
                  setError(text.pinMismatch);
                  setAttempt((current) => current + 1);
                  return;
                }
                setError('');
                setStep('create');
              });
              return;
            }
            if (step === 'create') {
              setFirst(pin);
              setError('');
              setStep('confirm');
              return;
            }
            if (pin !== first) {
              setFirst('');
              setError(text.pinMismatch);
              setStep('create');
              setAttempt((current) => current + 1);
              return;
            }
            void savePin(pin)
              .then(onSaved)
              .catch((pinError: unknown) => setError(pinError instanceof Error ? pinError.message : text.couldNotSave));
          }}
        />
      </View>
    </Modal>
  );
}
