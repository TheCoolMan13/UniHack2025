import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../context/AuthContext";
import { Colors } from "../../../constants/colors";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";

/**
 * Signup Screen
 * User registration with role selection
 */

const SignupScreen = () => {
    const navigation = useNavigation();
    const { register } = useAuth();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("passenger"); // 'driver', 'passenger', or 'both'
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await register({
                name,
                email,
                phone,
                password,
                role,
            });

            if (result.success) {
                // Navigation will be handled by AuthNavigator
            } else {
                setError(result.error || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join our car sharing community</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        autoCapitalize="words"
                    />

                    <Input
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a password"
                        secureTextEntry
                    />

                    <Input
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        secureTextEntry
                    />

                    {/* Role Selection */}
                    <View style={styles.roleContainer}>
                        <Text style={styles.roleLabel}>I want to:</Text>
                        <View style={styles.roleButtons}>
                            <Button
                                title="Drive"
                                variant={role === "driver" ? "primary" : "outline"}
                                onPress={() => setRole("driver")}
                                style={styles.roleButton}
                            />
                            <Button
                                title="Ride"
                                variant={role === "passenger" ? "primary" : "outline"}
                                onPress={() => setRole("passenger")}
                                style={styles.roleButton}
                            />
                            <Button
                                title="Both"
                                variant={role === "both" ? "primary" : "outline"}
                                onPress={() => setRole("both")}
                                style={styles.roleButton}
                            />
                        </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <Button
                        title="Create Account"
                        onPress={handleSignup}
                        loading={loading}
                        style={styles.signupButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Text
                            style={styles.linkText}
                            onPress={() => navigation.navigate("Login")}
                        >
                            Sign In
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default SignupScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLight,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    form: {
        flex: 1,
    },
    roleContainer: {
        marginBottom: 16,
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    roleButtons: {
        flexDirection: "row",
        gap: 8,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
    },
    errorText: {
        fontSize: 14,
        color: Colors.error,
        marginBottom: 16,
        textAlign: "center",
    },
    signupButton: {
        marginTop: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    linkText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "600",
    },
});

