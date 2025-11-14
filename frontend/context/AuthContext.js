import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

/**
 * Authentication Context
 * Manages user authentication state, role switching, and session persistence
 */

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentRole, setCurrentRole] = useState("passenger"); // 'driver' or 'passenger'

    // Load user session on app start
    useEffect(() => {
        loadUserSession();
    }, []);

    /**
     * Load user session from AsyncStorage and verify with backend
     */
    const loadUserSession = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const userData = await AsyncStorage.getItem("user");
            const savedRole = await AsyncStorage.getItem("currentRole");
            
            if (token && userData) {
                // Verify token with backend
                try {
                    const response = await authAPI.getCurrentUser();
                    if (response.data.success) {
                        const user = response.data.data.user;
                        setUser(user);
                        setIsAuthenticated(true);
                        if (savedRole) {
                            setCurrentRole(savedRole);
                        }
                    } else {
                        // Token invalid, clear storage
                        await clearStorage();
                    }
                } catch (error) {
                    // Token invalid or expired, clear storage
                    console.error("Token verification failed:", error);
                    await clearStorage();
                }
            }
        } catch (error) {
            console.error("Error loading user session:", error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Clear all stored authentication data
     */
    const clearStorage = async () => {
        try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("currentRole");
            setUser(null);
            setIsAuthenticated(false);
            setCurrentRole("passenger");
        } catch (error) {
            console.error("Error clearing storage:", error);
        }
    };

    /**
     * Login user
     */
    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            
            if (response.data.success) {
                const { user, token } = response.data.data;
                
                // Store token and user data
                await AsyncStorage.setItem("token", token);
                await AsyncStorage.setItem("user", JSON.stringify(user));
                await AsyncStorage.setItem("currentRole", user.role === "both" ? "passenger" : user.role);
                
                setUser(user);
                setCurrentRole(user.role === "both" ? "passenger" : user.role);
                setIsAuthenticated(true);
                
                return { success: true, user };
            } else {
                return { success: false, error: response.data.message || "Login failed" };
            }
        } catch (error) {
            console.error("Login error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Login failed";
            return { success: false, error: errorMessage };
        }
    };

    /**
     * Register new user
     */
    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            
            if (response.data.success) {
                const { user, token } = response.data.data;
                
                // Store token and user data
                await AsyncStorage.setItem("token", token);
                await AsyncStorage.setItem("user", JSON.stringify(user));
                const initialRole = user.role === "both" ? "passenger" : user.role;
                await AsyncStorage.setItem("currentRole", initialRole);
                
                setUser(user);
                setCurrentRole(initialRole);
                setIsAuthenticated(true);
                
                return { success: true, user };
            } else {
                return { success: false, error: response.data.message || "Registration failed" };
            }
        } catch (error) {
            console.error("Registration error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Registration failed";
            return { success: false, error: errorMessage };
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            // Call logout API (optional - for token blacklisting)
            try {
                await authAPI.logout();
            } catch (error) {
                // Continue with logout even if API call fails
                console.error("Logout API error:", error);
            }
            
            // Clear local storage
            await clearStorage();
        } catch (error) {
            console.error("Logout error:", error);
            // Still clear storage even if there's an error
            await clearStorage();
        }
    };

    /**
     * Switch between driver and passenger role
     */
    const switchRole = async (newRole) => {
        if (user && (user.role === "both" || user.role === newRole)) {
            setCurrentRole(newRole);
            await AsyncStorage.setItem("currentRole", newRole);
            
            // Update user object
            const updatedUser = { ...user, currentRole: newRole };
            setUser(updatedUser);
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        }
    };

    /**
     * Update user profile
     */
    const updateUser = async (updates) => {
        try {
            const updatedUser = { ...user, ...updates };
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error("Update user error:", error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        currentRole,
        login,
        register,
        logout,
        switchRole,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

