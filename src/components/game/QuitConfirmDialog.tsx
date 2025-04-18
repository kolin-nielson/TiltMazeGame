import React from 'react';
import { Button, Dialog, Text } from 'react-native-paper';
import { ThemeColors } from '../../types';

interface QuitConfirmDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
}

const QuitConfirmDialog: React.FC<QuitConfirmDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  colors,
}) => {
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title style={{ color: colors?.onSurface ?? '#000' }}>
        Quit Game?
      </Dialog.Title>
      <Dialog.Content>
        <Text
          variant="bodyMedium"
          style={{ color: colors?.onSurfaceVariant ?? '#444' }}
        >
          Are you sure you want to quit? Your current score will be lost if it's not your best.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={colors?.primary ?? '#6200ee'}>
          Cancel
        </Button>
        <Button onPress={onConfirm} textColor={colors?.error ?? '#B00020'}>
          Quit
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default React.memo(QuitConfirmDialog);
