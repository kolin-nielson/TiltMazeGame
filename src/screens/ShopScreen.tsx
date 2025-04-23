import React from 'react';
import { View, SafeAreaView, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '@store';
import { RootState } from '@store';
import { purchaseSkinAndSave, equipSkinAndSave, Skin } from '@store/slices/shopSlice';
import { Text, Button, Card } from 'react-native-paper';
import { ShopScreenNavigationProp } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

// Updated SkinPreview to handle gradients and patterns
const SkinPreview: React.FC<{ skin: Skin }> = ({ skin }) => {
  const rotation = useSharedValue(0);
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(1, { duration: 4000 }), -1);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));
  
  // Define IDs in the component scope
  const gradientId = `grad-${skin.id}`;
  const patternId = `pattern-${skin.id}`;

  const renderFill = () => {
    switch (skin.type) {
      case 'gradient':
        return `url(#${gradientId})`;
      case 'pattern':
        return `url(#${patternId})`;
      case 'solid':
      default:
        return skin.colors[0];
    }
  };

  return (
    <Animated.View style={style}>
      <Svg width="60" height="60" viewBox="0 0 40 40">
        <Defs>
          {skin.type === 'gradient' && (
            skin.gradientDirection === 'radial' ? (
              <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                {skin.colors.map((color, index) => (
                  <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
              </RadialGradient>
            ) : (
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                {skin.colors.map((color, index) => (
                  <Stop key={index} offset={`${(index / (skin.colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
              </LinearGradient>
            )
          )}
          {skin.type === 'pattern' && skin.patternType === 'dots' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10">
              <Rect width="10" height="10" fill={skin.colors[0]} />
              <Circle cx="5" cy="5" r="2" fill={skin.colors[1]} />
            </Pattern>
          )}
          {skin.type === 'pattern' && skin.patternType === 'stripes' && (
            <Pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <Rect width="10" height="10" fill={skin.colors[0]} />
              <Rect width="5" height="10" fill={skin.colors[1]} />
            </Pattern>
          )}
        </Defs>
        <Circle cx="20" cy="20" r="16" fill={renderFill()} />
      </Svg>
    </Animated.View>
  );
};

const ShopScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<ShopScreenNavigationProp>();

  const { coins, skins, purchasedSkins, equippedSkin } = useAppSelector(
    (state: RootState) => state.shop
  );
  const colors = useAppSelector((state: RootState) => state.theme.colors);
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);

  // Handler for buying a skin
  const handleBuySkin = (skinId: string) => {
    dispatch(purchaseSkinAndSave(skinId));
  };
  
  // Handler for equipping a skin
  const handleEquipSkin = (skinId: string) => {
    dispatch(equipSkinAndSave(skinId));
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <View style={[styles.coinsContainer, { backgroundColor: colors.surfaceVariant }]}>
          <FontAwesome5 name="coins" size={24} color="#FFD700" solid />
          <Text style={[styles.coinsText, { color: colors.primary }]}>{coins}</Text>
        </View>
      </View>
      <FlatList
        data={skins}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: skin }) => {
          const isPurchased = purchasedSkins.includes(skin.id);
          const isEquipped = equippedSkin === skin.id;
          return (
            <Card style={[styles.card, { backgroundColor: `${skin.colors[0]}30` }]}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.swatchWrapper, { borderColor: skin.colors[0] }]}>  
                  <SkinPreview skin={skin} />
                </View>
                <View style={styles.skinInfo}>
                  <Text style={[styles.skinName, { color: skin.type === 'solid' ? skin.colors[0] : colors.onSurface }]}>
                    {skin.name}
                  </Text>
                  <View style={styles.costContainer}>
                    <FontAwesome5 name="coins" size={14} color="#FFD700" solid />
                    <Text style={[styles.skinCost, { color: skin.type === 'solid' ? skin.colors[0] : colors.onSurfaceVariant, marginLeft: 4 }]}>
                      {skin.cost}
                    </Text>
                  </View>
                </View>
                {isEquipped ? (
                  <Button
                    mode="contained"
                    buttonColor={skin.colors[0]}
                    textColor="#fff"
                    disabled
                    style={styles.actionButton}
                  >
                    Equipped
                  </Button>
                ) : isPurchased ? (
                  <Button
                    mode="contained"
                    buttonColor={skin.colors[0]}
                    textColor="#fff"
                    onPress={() => handleEquipSkin(skin.id)}
                    style={styles.actionButton}
                  >
                    Equip
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    buttonColor={skin.colors[0]}
                    textColor="#fff"
                    disabled={coins < skin.cost}
                    onPress={() => handleBuySkin(skin.id)}
                    style={styles.actionButton}
                  >
                    {coins >= skin.cost ? 'Buy' : 'Not enough coins'}
                  </Button>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginVertical: 16,
    alignItems: 'center',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
  },
  coinsText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  swatchWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  skinInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  skinName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  skinCost: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionButton: {
    width: '100%',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default ShopScreen; 