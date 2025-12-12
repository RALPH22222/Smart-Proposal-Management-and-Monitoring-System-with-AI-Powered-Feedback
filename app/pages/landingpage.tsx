import React, { useEffect, useRef, useState } from 'react';
import { View,Text,Image,StyleSheet,Animated,TouchableOpacity,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import logo from '../assets/images/LOGO.png';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LandingPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoaded, setIsLoaded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      setIsLoaded(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
  }, [progress, fadeAnim]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Unitorium</Text>

      {!isLoaded ? (
        <View style={styles.loadingBarContainer}>
          <Animated.View style={[styles.loadingBar, { width: widthInterpolated }]} />
        </View>
      ) : (
        <Animated.View style={[styles.buttonsContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default LandingPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 40,
  },
  loadingBarContainer: {
    width: '70%',
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#DC143C', 
  },
  buttonsContainer: {
    width: '70%',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    backgroundColor: '#DC143C',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#A60F2F',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
