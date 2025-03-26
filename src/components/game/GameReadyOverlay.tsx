import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface GameReadyOverlayProps {
  mazeName: string;
  onStart: () => void;
  onBack: () => void;
}

export const GameReadyOverlay: React.FC<GameReadyOverlayProps> = ({
  mazeName,
  onStart,
  onBack,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      gameScreenStyles.overlay, 
      { backgroundColor: `${theme.background}CC` }
    ]}>
      <Card 
        style={[gameScreenStyles.messageCard, { backgroundColor: theme.surface }]} 
        elevation={3}
      >
        <Card.Title
          title={mazeName}
          titleVariant="titleLarge"
          titleStyle={[gameScreenStyles.cardTitle, { color: theme.onSurface || '#000000DE' }]}
        />
        <Card.Content style={gameScreenStyles.cardContent}>
          <Text style={[gameScreenStyles.instructions, { color: theme.onSurface || '#000000DE', opacity: 0.87 }]}>
            Tilt your device to move the ball to the goal!
          </Text>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onStart}
            style={[styles.button, { backgroundColor: theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: theme.onPrimary || '#FFFFFF' }}
          >
            Start
          </Button>
          <Button
            mode="outlined"
            onPress={onBack}
            style={[styles.button, { borderColor: theme.outline || theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: theme.primary }}
          >
            Back
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 20,
    height: 40,
  },
  buttonContent: {
    height: 40,
  },
});
