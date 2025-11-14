import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";

/**
 * Reusable Header Component
 * Provides consistent header styling with back button
 */

const Header = ({ title, showBack = true, rightComponent, style, showStatusBar = false }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.headerContainer, { backgroundColor: showStatusBar ? "#000000" : "transparent" }]}>
            {/* Black status bar area - only if showStatusBar is true */}
            {showStatusBar && <View style={[styles.statusBarArea, { height: insets.top }]} />}
            {/* Header content */}
            <View style={[styles.header, { paddingTop: showStatusBar ? 0 : 20 }, style]}>
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
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    headerContainer: {
        // backgroundColor is set dynamically based on showStatusBar prop
    },
    statusBarArea: {
        backgroundColor: "#000000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
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

