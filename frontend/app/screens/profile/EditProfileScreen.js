import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
                        <TouchableOpacity
                            style={[
                                styles.roleOption,
                                role === "passenger" && styles.roleOptionSelected
                            ]}
                            onPress={() => setRole("passenger")}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name="person-outline" 
                                size={24} 
                                color={role === "passenger" ? Colors.textLight : Colors.primary} 
                            />
                            <Text style={[
                                styles.roleOptionText,
                                role === "passenger" && styles.roleOptionTextSelected
                            ]}>
                                Passenger
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.roleOption,
                                role === "driver" && styles.roleOptionSelected
                            ]}
                            onPress={() => setRole("driver")}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name="car-outline" 
                                size={24} 
                                color={role === "driver" ? Colors.textLight : Colors.primary} 
                            />
                            <Text style={[
                                styles.roleOptionText,
                                role === "driver" && styles.roleOptionTextSelected
                            ]}>
                                Driver
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.roleOption,
                                role === "both" && styles.roleOptionSelected
                            ]}
                            onPress={() => setRole("both")}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name="people-outline" 
                                size={24} 
                                color={role === "both" ? Colors.textLight : Colors.primary} 
                            />
                            <Text style={[
                                styles.roleOptionText,
                                role === "both" && styles.roleOptionTextSelected
                            ]}>
                                Both
                            </Text>
                        </TouchableOpacity>
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
        gap: 12,
        justifyContent: "space-between",
    },
    roleOption: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.backgroundLight,
        minHeight: 100,
    },
    roleOptionSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    roleOptionText: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginTop: 8,
        textAlign: "center",
    },
    roleOptionTextSelected: {
        color: Colors.textLight,
    },
    saveButton: {
        marginTop: 8,
    },
});

