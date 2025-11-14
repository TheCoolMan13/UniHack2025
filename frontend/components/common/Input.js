import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

/**
 * Reusable Input Component
 * Supports labels, error messages, and different input types
 */

const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    secureTextEntry = false,
    keyboardType = "default",
    autoCapitalize = "none",
    multiline = false,
    numberOfLines = 1,
    style,
    ...props
}) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    multiline && styles.inputMultiline,
                    style,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                numberOfLines={numberOfLines}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

export default Input;

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputError: {
        borderColor: Colors.error,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
    },
});

