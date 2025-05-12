import React from 'react';
import Svg from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
interface MazeContainerProps {
  children: React.ReactNode;
  mazeBaseSize: number;
}
export const MazeContainer: React.FC<MazeContainerProps> = ({ children, mazeBaseSize }) => {
  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${mazeBaseSize} ${mazeBaseSize}`}
      >
        {children}
      </Svg>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});