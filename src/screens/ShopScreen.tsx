import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector, useAppDispatch } from '@store';
import { RootState } from '@store';
import { purchaseSkin, equipSkin, saveShopData } from '@store/slices/shopSlice';
import { Text, Button, Card } from 'react-native-paper';
import { ShopScreenNavigationProp } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

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
    dispatch(purchaseSkin(skinId));
    dispatch(saveShopData());
  };
  
  // Handler for equipping a skin
  const handleEquipSkin = (skinId: string) => {
    dispatch(equipSkin(skinId));
    dispatch(saveShopData());
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
          <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
          <Text style={[styles.coinsText, { color: colors.primary }]}>{coins}</Text>
        </View>
      </View>
      <View style={styles.listContainer}>
        {skins.map(skin => {
          const isPurchased = purchasedSkins.includes(skin.id);
          const isEquipped = equippedSkin === skin.id;
          return (
            <Card key={skin.id} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: skin.color, borderColor: colors.outline },
                  ]}
                />
                <View style={styles.skinInfo}>
                  <Text style={[styles.skinName, { color: colors.onSurface }]}>
                    {skin.name}
                  </Text>
                  <Text style={[styles.skinCost, { color: colors.onSurfaceVariant }]}>₹ {skin.cost}</Text>
                </View>
                {isEquipped ? (
                  <Button disabled>
                    Equipped
                  </Button>
                ) : isPurchased ? (
                  <Button
                    mode="contained"
                    onPress={() => handleEquipSkin(skin.id)}
                  >
                    Equip
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={() => handleBuySkin(skin.id)}
                  >
                    Buy
                  </Button>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </View>
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
    flex: 1,
  },
  card: {
    marginVertical: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  skinInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  skinName: {
    fontSize: 16,
    fontWeight: '600',
  },
  skinCost: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default ShopScreen; 