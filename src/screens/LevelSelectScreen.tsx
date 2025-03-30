import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMazes } from '../contexts/MazeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MazeRenderer from '../components/MazeRenderer';
import { Maze } from '../types';

type LevelSelectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LevelSelect'>;

interface LevelSelectScreenProps {
  navigation: LevelSelectScreenNavigationProp;
}

interface MazeItemProps {
  item: Maze;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.42;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;
const SCALE = ITEM_WIDTH / 300;

const isAndroid = Platform.OS === 'android';
const INITIAL_NUM_TO_RENDER = isAndroid ? 3 : 5;
const WINDOW_SIZE = isAndroid ? 3 : 5;

const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { mazes, userProgress } = useMazes();
  const insets = useSafeAreaInsets();

  const mazeData = useMemo(() => {
    return {
      easy: mazes.filter(maze => maze.difficulty === 'easy'),
      medium: mazes.filter(maze => maze.difficulty === 'medium'),
      hard: mazes.filter(maze => maze.difficulty === 'hard'),
    };
  }, [mazes]);

  const renderMazeItem = useCallback(({ item }: MazeItemProps) => {
    const progress = userProgress.levels[item.id];
    const isCompleted = progress && progress.completedCount > 0;
    const bestTime = progress?.bestTime;

    return (
      <TouchableOpacity
        style={[styles.mazeItem, { 
          backgroundColor: theme.surface,
          shadowColor: theme.onBackground,
        }]}
        onPress={() => navigation.navigate('Game', { mazeId: item.id })}
      >
        <View style={styles.mazePreview}>
          <MazeRenderer
            maze={item}
            ballPosition={item.startPosition}
            ballRadius={10 * SCALE}
            scale={SCALE}
            paused={true}
          />
        </View>

        <View style={styles.mazeInfo}>
          <Text style={[styles.mazeName, { color: theme.onSurface }]} numberOfLines={1}>
            {item.name}
          </Text>

          {isCompleted && (
            <View style={styles.completedBadge}>
              <MaterialIcons name="star" size={16} color={theme.secondary} />
              {bestTime && <Text style={[styles.bestTimeText, { color: theme.onSurface }]}>{(bestTime / 1000).toFixed(1)}s</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [navigation, theme.surface, theme.onSurface, theme.onBackground, theme.secondary, userProgress.levels]);

  const renderSectionHeader = useCallback((title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
        {title} ({count})
      </Text>
    </View>
  ), [theme.onSurface]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_WIDTH + 12,
    offset: (ITEM_WIDTH + 12) * index,
    index,
  }), []);

  const containerStyle = useMemo(() => [
    styles.container, 
    { 
      paddingBottom: insets.bottom,
      backgroundColor: theme.background
    }
  ], [insets.bottom, theme.background]);

  return (
    <View style={containerStyle}>
      <FlatList
        showsVerticalScrollIndicator={false}
        style={styles.list}
        data={[]}
        renderItem={null}
        initialNumToRender={1} 
        removeClippedSubviews={isAndroid}
        ListHeaderComponent={() => (
          <>
            {mazeData.easy.length > 0 && (
              <>
                {renderSectionHeader('Easy', mazeData.easy.length)}
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={mazeData.easy}
                  keyExtractor={(item: Maze) => item.id}
                  renderItem={renderMazeItem}
                  contentContainerStyle={styles.horizontalList}
                  initialNumToRender={INITIAL_NUM_TO_RENDER}
                  maxToRenderPerBatch={INITIAL_NUM_TO_RENDER}
                  windowSize={WINDOW_SIZE}
                  removeClippedSubviews={isAndroid}
                  getItemLayout={getItemLayout}
                />
              </>
            )}

            {mazeData.medium.length > 0 && (
              <>
                {renderSectionHeader('Medium', mazeData.medium.length)}
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={mazeData.medium}
                  keyExtractor={(item: Maze) => item.id}
                  renderItem={renderMazeItem}
                  contentContainerStyle={styles.horizontalList}
                  initialNumToRender={INITIAL_NUM_TO_RENDER}
                  maxToRenderPerBatch={INITIAL_NUM_TO_RENDER}
                  windowSize={WINDOW_SIZE}
                  removeClippedSubviews={isAndroid}
                  getItemLayout={getItemLayout}
                />
              </>
            )}

            {mazeData.hard.length > 0 && (
              <>
                {renderSectionHeader('Hard', mazeData.hard.length)}
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={mazeData.hard}
                  keyExtractor={(item: Maze) => item.id}
                  renderItem={renderMazeItem}
                  contentContainerStyle={styles.horizontalList}
                  initialNumToRender={INITIAL_NUM_TO_RENDER}
                  maxToRenderPerBatch={INITIAL_NUM_TO_RENDER}
                  windowSize={WINDOW_SIZE}
                  removeClippedSubviews={isAndroid}
                  getItemLayout={getItemLayout}
                />
              </>
            )}
          </>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  mazeItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mazePreview: {
    flex: 1,
    overflow: 'hidden',
  },
  mazeInfo: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mazeName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestTimeText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default LevelSelectScreen;
