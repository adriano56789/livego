import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Main: undefined;
  // Add other screen names here as needed
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    // Simulate loading time (3 seconds)
    const timer = setTimeout(() => {
      // Replace 'Main' with your main screen name
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={require('../../assets/splash.png')} // You'll need to add a splash.png to your assets
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.8, // 80% of screen width
    height: height * 0.4, // 40% of screen height
  },
});

export default SplashScreen;
