import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAppDispatch, useAppSelector, RootState } from '@store';
import { setHasSeenTutorial } from '@store/slices/settingsSlice';
import { TutorialScreenNavigationProp } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const MAZE_SIZE = Math.min(Dimensions.get('window').width - 40, 300);
const slides = [
  {
    key: 'tilt',
    icon: 'gesture-swipe',
    title: 'Tilt to Move',
    description: 'Tilt your device to roll the ball through challenging mazes.',
  },
  {
    key: 'coins',
    icon: 'currency-usd',
    title: 'Collect Coins',
    description: 'Gather coins in each level to earn rewards and unlock skins.',
  },
  {
    key: 'lasers',
    icon: 'ray-start-end',
    title: 'Avoid Lasers',
    description: 'Red laser gates are deadly—dodge them to stay alive.',
  },
  {
    key: 'goal',
    icon: 'flag-checkered',
    title: 'Reach the Goal',
    description: 'Navigate the ball into the exit to complete the maze.',
  },
  {
    key: 'settings',
    icon: 'cog',
    title: 'Customize',
    description: 'Use the sensitivity slider in Settings to fine-tune control.',
  },
];
const TutorialScreen: React.FC = () => {
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<TutorialScreenNavigationProp>();
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const dispatch = useAppDispatch();
  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      dispatch(setHasSeenTutorial(true));
      navigation.replace('Game');
    }
  };
  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card mode="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <MaterialCommunityIcons
            name={slides[index].icon as any}
            size={80}
            color={colors.primary}
            style={{ alignSelf: 'center', marginBottom: 16 }}
          />
          <Text variant="headlineMedium" style={{ color: colors.onSurface, textAlign: 'center' }}>
            {slides[index].title}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            {slides[index].description}
          </Text>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          {index > 0 && (
            <Button mode="outlined" onPress={handleBack} compact>
              Back
            </Button>
          )}
          <Button mode="contained" onPress={handleNext} compact>
            {index === slides.length - 1 ? 'Start Playing' : 'Next'}
          </Button>
        </Card.Actions>
      </Card>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    borderRadius: 16,
    padding: 0,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
export default TutorialScreen;