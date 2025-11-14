import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/colors";

/**
 * Reusable Button Component
 * Supports primary, secondary, and outline variants
 */

const Button = ({
    title,
    onPress,
    variant = "primary", // 'primary', 'secondary', 'outline'
    disabled = false,
    loading = false,
    style,
    textStyle,
    ...props
}) => {
    const getButtonStyle = () => {
        if (disabled || loading) {
            return [styles.button, styles.buttonDisabled, style];
        }
        
        switch (variant) {
            case "primary":
                return [styles.button, styles.buttonPrimary, style];
            case "secondary":
                return [styles.button, styles.buttonSecondary, style];
            case "outline":
                return [styles.button, styles.buttonOutline, style];
            default:
                return [styles.button, styles.buttonPrimary, style];
        }
    };

    const getTextStyle = () => {
        if (disabled || loading) {
            return [styles.buttonText, styles.buttonTextDisabled, textStyle];
        }
        
        switch (variant) {
            case "primary":
            case "secondary":
                return [styles.buttonText, styles.buttonTextLight, textStyle];
            case "outline":
                return [styles.buttonText, styles.buttonTextPrimary, textStyle];
            default:
                return [styles.buttonText, styles.buttonTextLight, textStyle];
        }
    };

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === "outline" ? Colors.primary : Colors.textLight} />
            ) : (
                <Text style={getTextStyle()}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

export default Button;

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    buttonPrimary: {
        backgroundColor: Colors.primary,
    },
    buttonSecondary: {
        backgroundColor: Colors.secondary,
    },
    buttonOutline: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    buttonDisabled: {
        backgroundColor: Colors.border,
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    buttonTextLight: {
        color: Colors.textLight,
    },
    buttonTextPrimary: {
        color: Colors.primary,
    },
    buttonTextDisabled: {
        color: Colors.textSecondary,
    },
});

