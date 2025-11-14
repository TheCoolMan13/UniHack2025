import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/colors";

/**
 * Reusable Header Component
 * Provides consistent header styling with back button
 */

const Header = ({ title, showBack = true, rightComponent, style }) => {
    const navigation = useNavigation();

    return (
        <View style={[styles.header, style]}>
            {showBack && (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
            {rightComponent && <View style={styles.rightComponent}>{rightComponent}</View>}
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: Colors.backgroundLight,
    },
    backButton: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    backText: {
        color: Colors.primary,
        fontSize: 20,
        fontWeight: "600",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.textPrimary,
        flex: 1,
    },
    rightComponent: {
        marginLeft: 12,
    },
});

