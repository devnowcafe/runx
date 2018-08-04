console.disableYellowBox = true;
import { Navigation } from 'react-native-navigation';
import { registerScreens } from './screens';
registerScreens();


export function Home() {
    Navigation.startSingleScreenApp({
        screen: {
            screen: 'app.HomeScreen',
            navigatorStyle: {
                navBarHidden: true,
                topBarElevationShadowEnabled: false,
                statusBarTextColorScheme: 'light',
                statusBarColor: 'white'
            }
        },
        passProps: {},
        animationType: 'fade',
        portraitOnlyMode: true
    })
}

Home()