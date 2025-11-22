import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './auth/login';
import AdminDashboard from './pages/users/admin/dashboard';
import EvaluatorDashboard from './pages/users/evaluator/dashboard';
import ProponentsDashboard from './pages/users/proponents/dashboard';
import RndDashboard from './pages/users/rnd/dashboard';
import LandingPage from './pages/landingpage';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LandingPage">
        <Stack.Screen 
          name="LandingPage" 
          component={LandingPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EvaluatorDashboard" 
          component={EvaluatorDashboard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ProponentsDashboard" 
          component={ProponentsDashboard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="RndDashboard" 
          component={RndDashboard} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
