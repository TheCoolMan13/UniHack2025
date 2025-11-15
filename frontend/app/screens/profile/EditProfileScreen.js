import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Header from "../../../components/common/Header";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { authAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

/**
 * Edit Profile Screen
 * Allows users to edit their profile information
 */
const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [role, setRole] = useState(user?.role || "passenger");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.updateProfile({
                name: name.trim(),
                phone: phone.trim() || null,
                role: role,
            });

            if (response.data.success) {
                // Update user in context
                updateUser(response.data.data.user);
                Alert.alert("Success", "Profile updated successfully!", [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack(),
                    },
                ]);
            } else {
                Alert.alert("Error", response.data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Update profile error:", error);
            let errorMessage = "Failed to update profile";
            if (error.response?.data) {
                if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                    errorMessage = error.response.data.errors.map(e => e.msg || e.message).join('\n');
                } else {
                    errorMessage = error.response.data.message || errorMessage;
                }
            } else {
                errorMessage = error.message || errorMessage;
            }
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Header title="Edit Profile" showBack={true} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <Input
                        label="Name *"
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                    />

                    <Input
                        label="Phone"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                    />
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Role</Text>
                    <Text style={styles.description}>
                        Select your role on the platform
                    </Text>

                    <View style={styles.roleContainer}>
                        <Button
                            title="Passenger"
                            variant={role === "passenger" ? "primary" : "outline"}
                            onPress={() => setRole("passenger")}
                            style={styles.roleButton}
                        />
                        <Button
                            title="Driver"
                            variant={role === "driver" ? "primary" : "outline"}
                            onPress={() => setRole("driver")}
                            style={styles.roleButton}
                        />
                        <Button
                            title="Both"
                            variant={role === "both" ? "primary" : "outline"}
                            onPress={() => setRole("both")}
                            style={styles.roleButton}
                        />
                    </View>
                </Card>

                <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.saveButton}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    roleContainer: {
        flexDirection: "row",
        gap: 8,
    },
    roleButton: {
        flex: 1,
    },
    saveButton: {
        marginTop: 8,
    },
});

