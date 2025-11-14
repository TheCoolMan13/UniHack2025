import React from "react";
import AppNavigator from "./app/navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";

/**
 * Car Sharing App
 * Root component that wraps the app with AuthProvider and AppNavigator
 */
const App = () => {
    console.log("App.js is being called");
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
};

export default App;
