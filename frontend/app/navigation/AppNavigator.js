import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

const Stack = createStackNavigator();
const navigationRef = React.createRef();

/**
 * App Navigator
 * Root navigator that switches between Auth and Main navigators
 * based on authentication state
 */
const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [navKey, setNavKey] = React.useState(0);

    // Force remount of MainNavigator when authenticated to ensure Home is shown
    useEffect(() => {
        if (isAuthenticated) {
            setNavKey(prev => prev + 1);
        }
    }, [isAuthenticated]);

    // Show loading screen while checking authentication
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer
            ref={navigationRef}
            key={isAuthenticated ? "main" : "auth"}
        >
            {isAuthenticated ? <MainNavigator key={navKey} /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default AppNavigator;

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.backgroundLight,
    },
});

