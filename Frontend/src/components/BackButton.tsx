// src/components/BackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';

interface BackButtonProps {
  color?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ color = COLORS.textPrimary }) => {
  const navigation = useNavigation();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start(() => navigation.goBack());
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={22} color={color} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BackButton;