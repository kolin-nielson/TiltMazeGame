import React from 'react';
import { Appbar, IconButton, Badge } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { ThemeColors } from '@types';
import { gameScreenStyles } from '@styles/GameScreenStyles';
import { useAppSelector } from '@store';
import { MaterialIcons } from '@expo/vector-icons';

interface GameHeaderProps {
  score: number;
  onQuit: () => void;
  colors: ThemeColors;
}

const GameHeader: React.FC<GameHeaderProps> = ({ score, onQuit, colors }) => {
  // Get coins from the shop state
  const coins = useAppSelector(state => state.shop.coins);
  
  return (
    <Appbar.Header
      style={[styles.header, { backgroundColor: colors.surface }]}
      mode="center-aligned"
    >
      <Appbar.Action icon="exit-to-app" color={colors.primary} size={24} onPress={onQuit} />
      <View style={styles.centerContent}>
        <Appbar.Content
          title={`Score ${score}`}
          titleStyle={{ color: colors.onSurface, fontSize: 20, fontWeight: 'bold' }}
          style={{ alignItems: 'center' }}
        />
      </View>
      <View style={styles.coinsContainer}>
        <Appbar.Action icon="monetization-on" color={colors.secondary} size={24} />
        <Badge style={[styles.badge, { backgroundColor: colors.secondary, color: colors.onSecondary }]}>
          {coins}
        </Badge>
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingHorizontal: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsContainer: {
    position: 'relative',
    marginRight: 16,
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});

export default React.memo(GameHeader);
