import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { gameScreenStyles } from '../../styles/GameScreenStyles';

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
  return (
    <View style={gameScreenStyles.overlay}>
      <Card style={gameScreenStyles.messageCard} elevation={5}>
        <Card.Title
          title={mazeName}
          titleVariant="titleLarge"
          titleStyle={gameScreenStyles.cardTitle}
        />
        <Card.Content style={gameScreenStyles.cardContent}>
          <Text style={gameScreenStyles.instructions}>
            Tilt your device to move the ball to the goal!
          </Text>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.cardActions}>
          <Button
            mode="contained"
            onPress={onStart}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Start
          </Button>
          <Button
            mode="outlined"
            onPress={onBack}
            style={styles.button}
            contentStyle={styles.buttonContent}
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
