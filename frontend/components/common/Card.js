import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

/**
 * Reusable Card Component
 * Provides consistent card styling throughout the app
 */

const Card = ({ children, style, ...props }) => {
    return (
        <View style={[styles.card, style]} {...props}>
            {children}
        </View>
    );
};

export default Card;

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 3,
    },
});

