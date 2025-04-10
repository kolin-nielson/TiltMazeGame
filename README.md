# Tilt Maze Game

A physics-based mobile game where players navigate a ball through challenging mazes by tilting their device. Perfect for casual gaming sessions, Tilt Maze offers an engaging experience that tests your dexterity and spatial awareness with progressively difficult levels.

## Application Description

Tilt Maze is an interactive mobile game that leverages your device's gyroscope to create an immersive gaming experience. Players tilt their phones to guide a ball through increasingly complex mazes, avoiding walls and finding the most efficient path to the goal. The game features 30 unique mazes across three difficulty levels (Easy, Medium, Hard), each designed to challenge your spatial reasoning and motor skills.

The app includes a comprehensive theme system, allowing players to personalize their gaming experience with different color schemes. Progress tracking keeps record of completed levels and best times, giving players incentive to improve their performance. With intuitive controls and polished visuals, Tilt Maze provides an accessible yet challenging gaming experience for players of all ages.

## Wireframes

Below are the wireframes created for the Tilt Maze Game application:

![Home Screen and Navigation](Wireframes/home.png)
*Home screen and primary navigation flow*

![Level Select and Game Screen](Wireframes/levelselect.png)
*Level selection interface and active gameplay screen*

![Settings and Theme Customization](Wireframes/settings.png)
*Settings panel and theme customization options*

## Material Design Implementation

The Tilt Maze game embraces Google's Material Design principles to create an intuitive and visually pleasing user experience. Each screen utilizes elevation, surface differentiation, and intentional color choices to enhance usability. The app implements consistent components like cards with proper elevation shadows for level selection, buttons with appropriate state changes, and modal overlays that follow Material Design guidelines for transitions and depth.

Material Design typography principles are applied throughout the application with a clear hierarchy of text styles. Headers, body text, and interactive elements follow Material guidelines for font weight, size, and spacing. The color system is built on Material Design's theming approach, with primary, secondary, surface, and accent colors carefully selected for optimal contrast and accessibility. The custom theme editor allows users to personalize their experience while maintaining Material Design's emphasis on meaningful motion and depth.

Interactive elements follow Material Design's responsive touch feedback principles, with ripple effects on buttons and controls. Dialog components for settings and level completion use Material Design's standard layout patterns and animation timing. The game embraces Material Design's principles of purposeful animation through smooth transitions between screens and state changes. Even the game elements themselves—like the ball and maze surfaces—respect Material Design's approach to representing physical objects with appropriate shadows and elevation to create a cohesive, polished experience.

## Features

- **Motion Controls**: Use your device's built-in gyroscope to control the game with intuitive tilting movements
- **Multiple Difficulty Levels**: Progress through various mazes of increasing complexity
- **Customizable Themes**: Choose from light, dark, blue, or create your own custom color theme
- **Performance Tracking**: Track your best times and completion statistics for each level
- **Responsive Design**: Optimized for both phones and tablets with adaptive layouts

## Technical Details

- Built with React Native and Expo
- Uses React Navigation for screen management
- Implements Matter.js physics engine for realistic ball movement
- Leverages device sensors via Expo Sensors for tilt controls
- Persists user preferences and progress with AsyncStorage
- Styled with React Native Paper (Material Design components)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo Go app for testing on physical devices

## Acknowledgements

- [Expo](https://expo.dev/) for simplifying React Native development
- [Matter.js](https://brm.io/matter-js/) for the physics engine
- [React Native Paper](https://callstack.github.io/react-native-paper/) for Material Design components

## Project Structure

```
TiltMazeGame/
├── src/                # Source code
│   ├── api/            # API clients and services
│   ├── components/     # UI components
│   ├── contexts/       # React contexts for state management
│   ├── features/       # Feature modules
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Main app screens
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── assets/             # Static assets
├── Wireframes/         # App wireframes and design mockups
└── docs/               # Documentation
```

