import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GAME } from '@config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk } from '@reduxjs/toolkit';

export interface Skin {
  id: string;
  name: string;
  cost: number;
  type: 'solid' | 'gradient' | 'pattern';
  colors: string[];
  gradientDirection?: 'linear' | 'radial';
  patternType?: 'stripes' | 'dots';
}

export interface ShopState {
  coins: number;
  skins: Skin[];
  purchasedSkins: string[];
  equippedSkin: string;
}

const initialSkins: Skin[] = [
  { id: 'default', name: 'Steel', cost: 0, type: 'solid', colors: ['#B0BEC5'] },
  { id: 'ocean-gradient', name: 'Ocean Wave', cost: 150, type: 'gradient', colors: ['#00C9FF', '#92FE9D'], gradientDirection: 'linear' },
  { id: 'sunset-gradient', name: 'Sunset', cost: 200, type: 'gradient', colors: ['#FF7E5F', '#FEB47B'], gradientDirection: 'linear' },
  { id: 'purple-haze', name: 'Purple Haze', cost: 250, type: 'gradient', colors: ['#7C4DFF', '#FF6EC7'], gradientDirection: 'radial' },
  { id: 'cyber-dots', name: 'Cyber Dots', cost: 350, type: 'pattern', colors: ['#0A0A0A', '#00E5FF'], patternType: 'dots' },
  { id: 'zebra', name: 'Zebra', cost: 400, type: 'pattern', colors: ['#FFFFFF', '#333333'], patternType: 'stripes' },
  { id: 'gold', name: 'Pure Gold', cost: 600, type: 'gradient', colors: ['#FFD700', '#FFA500'], gradientDirection: 'radial' },
  { id: 'lava', name: 'Lava Flow', cost: 750, type: 'gradient', colors: ['#FF3D00', '#FF7E5F', '#FEB47B'], gradientDirection: 'linear' },
  { id: 'rainbow', name: 'Rainbow Swirl', cost: 1000, type: 'gradient', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'], gradientDirection: 'radial' },

  // Custom fun skins
  { id: 'galaxy-swirl', name: 'Galaxy Swirl', cost: 1200, type: 'gradient', colors: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'], gradientDirection: 'radial' },
  { id: 'neon-glow', name: 'Neon Glow', cost: 1800, type: 'gradient', colors: ['#FF00FF', '#00FFFF'], gradientDirection: 'linear' },
  { id: 'prism-spectrum', name: 'Prism Spectrum', cost: 2000, type: 'gradient', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'], gradientDirection: 'linear' },
  { id: 'checkerboard', name: 'Checkerboard', cost: 2500, type: 'pattern', colors: ['#FFFFFF', '#000000'], patternType: 'stripes' },
  { id: 'confetti-fun', name: 'Confetti Fun', cost: 3000, type: 'pattern', colors: ['#FF385C', '#FFBF00', '#1CE6FF', '#FF34FF', '#FF4A46'], patternType: 'dots' },
];

const initialState: ShopState = {
  coins: 0,
  skins: initialSkins,
  purchasedSkins: ['default'],
  equippedSkin: 'default',
};

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
      });
  },
});

export const { collectCoin, purchaseSkin, equipSkin } = shopSlice.actions;


export const collectCoinAndSave = () => (dispatch: any) => {
  dispatch(collectCoin());
  setTimeout(() => {
    dispatch(saveShopData());
  }, 0);
};

export const purchaseSkinAndSave = (skinId: string) => (dispatch: any) => {
  dispatch(purchaseSkin(skinId));
  dispatch(saveShopData());
};

export const equipSkinAndSave = (skinId: string) => (dispatch: any) => {
  dispatch(equipSkin(skinId));
  dispatch(saveShopData());
};

export default shopSlice.reducer; 