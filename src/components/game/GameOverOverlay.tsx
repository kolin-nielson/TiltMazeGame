import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
// Assuming gameScreenStyles contains the necessary overlay styles
// If not, we might need to define styles here or import from a shared location
import { gameScreenStyles } from '../../styles/GameScreenStyles'; 

interface GameOverOverlayProps {
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
  onContinueWithAd: () => void; // Placeholder for ad logic
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  bestScore,
  onPlayAgain,
  onContinueWithAd,
}) => {
  // Use react-native-paper's useTheme or your custom theme context
  // const { theme } = useYourThemeContext(); 
  const theme = useTheme(); // Assuming react-native-paper theme

  return (
    <View style={gameScreenStyles.overlayBase}> 
      {/* Using Card for better structure, adjust styles as needed */}
      <Card style={[gameScreenStyles.overlayContent, { backgroundColor: theme.colors.surface }]}>
        <Card.Title 
          title="Game Over" 
          titleStyle={[{ fontSize: 24, fontWeight: 'bold', color: theme.colors.error, alignSelf: 'center' }]} // Example inline styles 
          subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
        />
        <Card.Content style={{ alignItems: 'center' }}>
          <Text style={[gameScreenStyles.overlayText, { color: theme.colors.onSurface }]}>
            Your Score: {score}
          </Text>
          <Text style={[gameScreenStyles.overlayText, { color: theme.colors.onSurface, marginBottom: 30 }]}>
            Best Score: {bestScore}
          </Text>
        </Card.Content>
        <Card.Actions style={gameScreenStyles.overlayButtonContainer}> 
          <Button
            mode="contained"
            onPress={onPlayAgain}
            style={gameScreenStyles.overlayButton}
            labelStyle={{ color: theme.colors.onPrimary }} // Ensure text color contrasts with button
            buttonColor={theme.colors.primary} // Explicitly set button color
          >
            Play Again
          </Button>
          <Button
             mode="outlined"
             onPress={() => {
                console.log("Continue with Ad requested");
                // Add ad logic here later
                onContinueWithAd();
             }}
             style={gameScreenStyles.overlayButton}
             textColor={theme.colors.primary} // Set text color for outlined button
             // Potentially add icon="play-circle-outline"
          >
            Continue (Ad)
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}; 