# Tilt Maze Game 🚀

An addictive mobile puzzle game that uses device tilt to navigate a ball through challenging mazes!

## Table of Contents
- [Overview](#overview)
- [Wireframes](#wireframes)
- [Features](#features)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview
Tilt Maze Game challenges players to tilt their phone to roll a ball from the start to the green goal. Mazes grow more complex with static walls, dynamic laser gates, and collectible coins. Earn coins to unlock fun skins and strive for the highest score!

## Wireframes
<p align="center">
  <img src="Wireframes/home.png" alt="Home Screen" width="30%" />
  <img src="Wireframes/levelselect.png" alt="Level Select" width="30%" />
  <img src="Wireframes/settings.png" alt="Settings" width="30%" />
</p>

## Features
- **Intuitive Tilt Controls**: Uses device accelerometer for natural motion
- **Procedural Mazes**: Every level is generated via depth-first search
- **Laser Gates**: Timed obstacles that cycle on/off for extra challenge
- **Coin Collectibles**: Persistent currency to unlock over a dozen ball skins
- **Themes & Settings**: Light/dark mode, sensitivity control, and haptics toggle
- **Advanced Animations**: Smooth transitions powered by Reanimated
- **Realistic Physics**: Collisions and ball movement via Matter.js
- **High Score Tracking**: Progress saved locally with AsyncStorage

## Technologies
- **React Native** & **Expo** — Cross-platform mobile development
- **TypeScript** — Type safety and autocompletion
- **Redux Toolkit** — Streamlined state management
- **React Navigation** — Screen navigation and routing
- **React Native Paper** — Material Design UI components
- **React Native Reanimated** — High-performance animations
- **Matter.js** — 2D physics engine for realistic ball dynamics
- **@react-native-async-storage** — Persistent storage of settings & progress

## Architecture
- **Components**: Reusable UI modules in `src/components`  
- **Hooks**: Custom hooks (gyroscope, physics) in `src/hooks`  
- **Store (Redux)**: Slice-based state in `src/store/slices`  
- **Screens**: App screens in `src/screens`  
- **Utils**: Utility functions in `src/utils`  
- **Config**: Constants & themes in `src/config/constants.ts`

## Installation
```bash
git clone https://github.com/kolin-nielson/TiltMazeGame.git
cd TiltMazeGame
npm install
npm run ios      # Launch on iOS simulator
npm run android  # Launch on Android emulator
npm start        # Open Expo dev tools
```

## Project Structure
```bash
src/
├── components/       # UI components
│   ├── maze/         # Maze renderer (walls, ball, goal, coins)
│   └── common/       # Shared components (buttons, headers)
├── hooks/            # Custom React hooks (sensor & physics)
├── navigation/       # React Navigation setup
├── screens/          # App screens (Home, Game, Settings)
├── store/            # Redux store & slices
├── config/           # App constants & themes
├── styles/           # Shared style definitions
└── utils/            # Helper functions (maze generator)
```

## Contributing
1. Fork the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to origin & open a PR

*All contributions welcome — please follow ESLint & Prettier guidelines.*

## License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
