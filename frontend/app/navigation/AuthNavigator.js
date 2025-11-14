import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";

const Stack = createStackNavigator();

/**
 * Authentication Navigator
 * Handles onboarding, login, and signup screens
 */

const AuthNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Onboarding"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;

