import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '@components/common/Button';

jest.mock('@store', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#ffffff',
    surface: '#f5f5f5',
    onPrimary: '#ffffff',
  }),
}));

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Button title="Test Button" />);

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress handler when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPressMock} />);

    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Disabled Button" onPress={onPressMock} disabled />);

    fireEvent.press(getByText('Disabled Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows activity indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(<Button title="Loading Button" loading />);

    expect(queryByText('Loading Button')).toBeNull();

    expect(UNSAFE_getByType('ActivityIndicator')).toBeTruthy();
  });

  it('applies different styles based on variant', () => {
    const { rerender, getByTestId } = render(<Button title="Primary Button" testID="button" />);

    // Default variant is primary
    let button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#6200ee',
        }),
      ])
    );

    rerender(<Button title="Secondary Button" variant="secondary" testID="button" />);
    button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#03dac6',
        }),
      ])
    );

    rerender(<Button title="Outline Button" variant="outline" testID="button" />);
    button = getByTestId('button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: 'transparent',
          borderColor: '#6200ee',
        }),
      ])
    );
  });
});
