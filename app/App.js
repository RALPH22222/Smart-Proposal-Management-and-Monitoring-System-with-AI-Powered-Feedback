import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Easing } from 'react-native';
import LoginScreen from './auth/login';
import RegisterScreen from './auth/register';
import AdminDashboard from './pages/users/admin/dashboard';
import AdminAccounts from './pages/users/admin/accounts';
import AdminContents from './pages/users/admin/contents';
import AdminReports from './pages/users/admin/reports';
import AdminSystem from './pages/users/admin/system';
import AdminSettings from './pages/users/admin/settings';
import EvaluatorDashboard from './pages/users/evaluator/dashboard';
import EvaluatorProposals from './pages/users/evaluator/proposals';
import EvaluatorUnderReview from './pages/users/evaluator/ReviewProposals';
import EvaluatorCompleted from './pages/users/evaluator/ReviewedProposals';
import EvaluatorSettings from './pages/users/evaluator/Settings';
import EvaluatorNotifications from './pages/users/evaluator/notification';
import ProponentsDashboard from './pages/users/proponents/profile';
import RndDashboard from './pages/users/rnd/dashboard';
import LandingPage from './pages/landingpage';

const Stack = createStackNavigator();

// Custom transition configuration for smooth animations
const smoothTransitionConfig = {
  animation: 'timing',
  config: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth bezier curve
  },
};

// Screen options with smooth transitions for evaluator screens
const evaluatorScreenOptions = {
  headerShown: false,
  ...TransitionPresets.SlideFromRightIOS,
  transitionSpec: {
    open: smoothTransitionConfig,
    close: smoothTransitionConfig,
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 0.9, 1],
          outputRange: [0, 0.25, 0.7, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

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
          name="Register" 
          component={RegisterScreen} 
          options={{ 
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
          }} 
        />
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminAccounts" 
          component={AdminAccounts} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminContents" 
          component={AdminContents} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminReports" 
          component={AdminReports} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminSystem" 
          component={AdminSystem} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminSettings" 
          component={AdminSettings} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="EvaluatorDashboard" 
          component={EvaluatorDashboard} 
          options={evaluatorScreenOptions}
        />
        <Stack.Screen 
          name="EvaluatorProposals" 
          component={EvaluatorProposals} 
          options={evaluatorScreenOptions}
        />
        <Stack.Screen 
          name="EvaluatorUnderReview" 
          component={EvaluatorUnderReview} 
          options={evaluatorScreenOptions}
        />
        <Stack.Screen 
          name="EvaluatorCompleted" 
          component={EvaluatorCompleted} 
          options={evaluatorScreenOptions}
        />
        <Stack.Screen 
          name="EvaluatorSettings" 
          component={EvaluatorSettings} 
          options={evaluatorScreenOptions}
        />
        <Stack.Screen 
          name="EvaluatorNotifications" 
          component={EvaluatorNotifications} 
          options={evaluatorScreenOptions}
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
