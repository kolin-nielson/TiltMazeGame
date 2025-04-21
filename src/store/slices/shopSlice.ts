import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GAME } from '@config/constants';

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
});

export const { collectCoin, purchaseSkin, equipSkin } = shopSlice.actions;
export default shopSlice.reducer; 