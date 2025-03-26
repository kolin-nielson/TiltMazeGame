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
        elevation={5}
      >
        <Card.Title
          title={mazeName}
          titleVariant="titleLarge"
          titleStyle={[gameScreenStyles.cardTitle, { color: theme.text }]}
        />
        <Card.Content style={gameScreenStyles.cardContent}>
          <Text style={[gameScreenStyles.instructions, { color: theme.text }]}>
            Tilt your device to move the ball to the goal!
          </Text>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onStart}
            style={[styles.button, { backgroundColor: theme.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={{ color: 'white' }}
          >
            Start
          </Button>
          <Button
            mode="outlined"
            onPress={onBack}
            style={[styles.button, { borderColor: theme.primary }]}
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
    borderRadius: 8,
  },
  buttonContent: {
    height: 44,
  },
});
