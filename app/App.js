import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import LoginScreen from './auth/login';
import LandingPage from './pages/landingpage';
import ProponentsDashboard from './pages/proponents/profile';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator  
        initialRouteName="LandingPage"
        screenOptions={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardOverlayEnabled: true,
        }}
      >
        <Stack.Screen 
          name="LandingPage" 
          component={LandingPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ 
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
          }} 
        />
        <Stack.Screen 
          name="ProponentsDashboard" 
          component={ProponentsDashboard} 
          options={{ 
            headerShown: false,
            ...TransitionPresets.ModalSlideFromBottomIOS,
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
