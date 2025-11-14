import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

/**
 * SearchBar Component
 * Large search bar similar to Uber's design
 * @param {Object} props - Component props
 * @param {string} props.placeholder - Placeholder text
 * @param {Function} props.onPress - Press handler
 * @param {React.ReactNode} props.rightButton - Right side button component
 */
const SearchBar = ({ placeholder = 'Where to?', onPress, rightButton }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.searchIcon}>
        <Text style={styles.iconText}>🔍</Text>
      </View>
      <Text style={styles.placeholder}>{placeholder}</Text>
      {rightButton && <View style={styles.rightButton}>{rightButton}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary || Colors.textLight,
  },
  rightButton: {
    marginLeft: 12,
  },
});

export default SearchBar;

