import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GAME } from '@config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';

export interface Skin {
  id: string;
  name: string;
  cost: number;
  color: string;
}

export interface ShopState {
  coins: number;
  skins: Skin[];
  purchasedSkins: string[];
  equippedSkin: string;
}

const initialSkins: Skin[] = [
  { id: 'default', name: 'Default', cost: 0, color: '#FF4081' },
  { id: 'blue', name: 'Blue', cost: 50, color: '#2196F3' },
  { id: 'green', name: 'Green', cost: 100, color: '#4CAF50' },
  { id: 'yellow', name: 'Yellow', cost: 150, color: '#FFEB3B' },
  { id: 'purple', name: 'Purple', cost: 200, color: '#9C27B0' },
];

const initialState: ShopState = {
  coins: 0,
  skins: initialSkins,
  purchasedSkins: ['default'],
  equippedSkin: 'default',
};

// Thunk to load shop data from AsyncStorage
export const loadShopData = createAsyncThunk(
  'shop/loadShopData',
  async (_, { rejectWithValue }) => {
    try {
      const shopDataJson = await AsyncStorage.getItem('shopData');
      if (shopDataJson) {
        return JSON.parse(shopDataJson);
      }
      return { coins: 0, purchasedSkins: ['default'], equippedSkin: 'default' };
    } catch (error) {
      return rejectWithValue('Failed to load shop data');
    }
  }
);

// Thunk to save shop data to AsyncStorage
export const saveShopData = createAsyncThunk(
  'shop/saveShopData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { shop: ShopState };
      const { coins, purchasedSkins, equippedSkin } = state.shop;
      
      await AsyncStorage.setItem(
        'shopData',
        JSON.stringify({ coins, purchasedSkins, equippedSkin })
      );
      
      return { coins, purchasedSkins, equippedSkin };
    } catch (error) {
      return rejectWithValue('Failed to save shop data');
    }
  }
);

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    collectCoin: state => {
      state.coins += GAME.POINTS_PER_COIN;
    },
    purchaseSkin: (state, action: PayloadAction<string>) => {
      const skinId = action.payload;
      if (state.purchasedSkins.includes(skinId)) return;
      const skin = state.skins.find(s => s.id === skinId);
      if (skin && state.coins >= skin.cost) {
        state.coins -= skin.cost;
        state.purchasedSkins.push(skinId);
      }
    },
    equipSkin: (state, action: PayloadAction<string>) => {
      const skinId = action.payload;
      if (state.purchasedSkins.includes(skinId)) {
        state.equippedSkin = skinId;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadShopData.fulfilled, (state, action) => {
        if (action.payload) {
          state.coins = action.payload.coins || 0;
          state.purchasedSkins = action.payload.purchasedSkins || ['default'];
          state.equippedSkin = action.payload.equippedSkin || 'default';
        }
      })
      .addCase(saveShopData.fulfilled, () => {
        // Nothing to do here, state is already updated
      });
  },
});

export const { collectCoin, purchaseSkin, equipSkin } = shopSlice.actions;
export default shopSlice.reducer; 