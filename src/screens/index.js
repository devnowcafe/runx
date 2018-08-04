import { Navigation } from 'react-native-navigation';

import HomeScreen from './Home';

export function registerScreens() {
    Navigation.registerComponent('app.HomeScreen', () => HomeScreen);
}