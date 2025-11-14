import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./app/navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";

/**
 * Car Sharing App
 * Root component that wraps the app with AuthProvider and AppNavigator
 */
const App = () => {
    console.log("App.js is being called");
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
};

export default App;
