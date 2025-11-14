import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

/**
 * ServiceButton Component
 * Square button for services (like Uber's Ride, Reserve, etc.)
 * @param {Object} props - Component props
 * @param {string} props.icon - Icon emoji or text
 * @param {string} props.label - Button label
 * @param {Function} props.onPress - Press handler
 * @param {Object} props.style - Additional styles
 */
const ServiceButton = ({ icon, label, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  iconContainer: {
    marginBottom: 12,
  },
  icon: {
    fontSize: 48,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary || Colors.text,
    textAlign: 'center',
  },
});

export default ServiceButton;

