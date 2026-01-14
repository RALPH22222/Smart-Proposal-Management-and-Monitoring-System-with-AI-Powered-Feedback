import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingPage() {
  const router = useRouter();

  return (
    <ImageBackground
    source={require('../../assets/images/image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/LOGO.png')} 
            style={styles.logo} 
          />
          <Text style={styles.title}>WMSU Project Proposals</Text>
          <Text style={styles.subtitle}>Streamlined Management & Monitoring</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.description}>
            Manage your research and extension proposals efficiently with our AI-powered platform.
          </Text>

          <TouchableOpacity 
            style={styles.buttonPrimary} 
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.buttonTextPrimary}>Get Started</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    backgroundColor: '#C8102E', 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(140, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between', 
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  footer: {
    marginBottom: 40,
    gap: 20,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  buttonPrimary: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonTextPrimary: {
    color: '#C8102E', 
    fontSize: 18,
    fontWeight: 'bold',
  },
});