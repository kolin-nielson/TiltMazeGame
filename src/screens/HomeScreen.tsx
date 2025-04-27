import React, { useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector, RootState } from '@store';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '@navigation/types';
import GameLogo from '@components/logo/GameLogo';
import { StatusBar } from 'expo-status-bar';
import { Button, Text } from 'react-native-paper';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);
  const highestScore = useAppSelector((state: RootState) => state.settings.highestScore);
  const hasSeenTutorial = useAppSelector((state: RootState) => state.settings.hasSeenTutorial);
  const insets = useSafeAreaInsets();

  const handlePlay = useCallback(() => {
    if (!hasSeenTutorial) {
      navigation.navigate('Tutorial');
    } else {
      navigation.navigate('Game');
    }
  }, [hasSeenTutorial, navigation]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors?.background ?? '#ffffff',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.mainContent}>
        <View style={styles.logoContainer}>
          <GameLogo size={150} showText={true} />
        </View>

        <View style={styles.statsContainer}>
          <Text
            style={[
              styles.statLabel,
              {
                color: colors?.onSurfaceVariant ?? '#444444',
                fontSize: 14,
                textTransform: 'uppercase',
                fontWeight: '500',
              },
            ]}
          >
            Best Score
          </Text>
          <Text
            style={[
              styles.statNumber,
              {
                color: colors?.primary ?? '#6200ee',
                fontSize: 48,
                fontWeight: 'bold',
              },
            ]}
          >
            {highestScore ?? 0}
          </Text>
        </View>

        <View style={styles.menuContainer}>
          <Button
            mode="contained"
            icon={({ size, color }) => <MaterialIcons name="play-arrow" size={size} color={color} />}
            onPress={handlePlay}
            style={styles.menuButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Play
          </Button>

          <Button
            mode="outlined"
            icon={({ size, color }) => <MaterialIcons name="settings" size={size} color={color} />}
            onPress={() => navigation.navigate('Settings')}
            style={styles.menuButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Settings
          </Button>

          <Button
            mode="outlined"
            icon={({ size, color }) => <MaterialIcons name="store" size={size} color={color} />}
            onPress={() => navigation.navigate('Shop')}
            style={styles.menuButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Shop
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  statLabel: {
    marginBottom: 4,
    opacity: 0.8,
  },
  statNumber: {},
  menuContainer: {
    width: '85%',
    alignItems: 'center',
  },
  menuButton: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 30,
  },
  buttonContent: {
    height: 48,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
