import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, Appearance } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "../../constants/colors";

/**
 * Time Picker Component
 * Platform-native time picker for selecting time
 */

const TimePicker = ({ label, value, onChange, placeholder = "Select time" }) => {
    const [showPicker, setShowPicker] = useState(false);
    const colorScheme = Appearance.getColorScheme();
    const [tempTime, setTempTime] = useState(() => {
        if (value) {
            // Parse time string (e.g., "7:30 AM" or "19:30")
            const timeStr = value.trim();
            const now = new Date();
            
            // Try to parse different time formats
            if (timeStr.includes("AM") || timeStr.includes("PM")) {
                // 12-hour format
                const [timePart, period] = timeStr.split(" ");
                const [hours, minutes] = timePart.split(":").map(Number);
                let hour24 = hours;
                if (period === "PM" && hours !== 12) hour24 += 12;
                if (period === "AM" && hours === 12) hour24 = 0;
                now.setHours(hour24, minutes || 0, 0, 0);
            } else {
                // 24-hour format
                const [hours, minutes] = timeStr.split(":").map(Number);
                now.setHours(hours || 0, minutes || 0, 0, 0);
            }
            return now;
        }
        return new Date();
    });

    // Update tempTime when value changes externally
    useEffect(() => {
        if (value) {
            const timeStr = value.trim();
            const now = new Date();
            
            if (timeStr.includes("AM") || timeStr.includes("PM")) {
                const [timePart, period] = timeStr.split(" ");
                const [hours, minutes] = timePart.split(":").map(Number);
                let hour24 = hours;
                if (period === "PM" && hours !== 12) hour24 += 12;
                if (period === "AM" && hours === 12) hour24 = 0;
                now.setHours(hour24, minutes || 0, 0, 0);
            } else {
                const [hours, minutes] = timeStr.split(":").map(Number);
                now.setHours(hours || 0, minutes || 0, 0, 0);
            }
            setTempTime(now);
        }
    }, [value]);

    const formatTime = (date) => {
        if (!date) return "";
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        const minutesStr = minutes.toString().padStart(2, "0");
        return `${hour12}:${minutesStr} ${period}`;
    };

    const handleTimeChange = (event, date) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
            if (event.type === "set" && date) {
                const timeString = formatTime(date);
                onChange(timeString);
            }
        } else {
            // iOS - update temp time as user scrolls
            if (date) {
                setTempTime(date);
            }
        }
    };

    const handleIOSConfirm = () => {
        const timeString = formatTime(tempTime);
        onChange(timeString);
        setShowPicker(false);
    };

    const handleIOSCancel = () => {
        setShowPicker(false);
    };

    const displayValue = value || placeholder;

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.pickerText, !value && styles.placeholderText]}>
                    {displayValue}
                </Text>
                <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            {Platform.OS === "android" && showPicker && (
                <DateTimePicker
                    value={tempTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            {Platform.OS === "ios" && (
                <Modal
                    visible={showPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleIOSCancel}
                >
                    <View style={styles.iosModalOverlay}>
                        <TouchableOpacity
                            style={styles.iosModalOverlayTouchable}
                            activeOpacity={1}
                            onPress={handleIOSCancel}
                        />
                        <View style={styles.iosModalContent}>
                            <View style={styles.iosPickerHeader}>
                                <TouchableOpacity
                                    style={styles.iosPickerButton}
                                    onPress={handleIOSCancel}
                                >
                                    <Text style={styles.iosPickerButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.iosPickerTitle}>Select Time</Text>
                                <TouchableOpacity
                                    style={styles.iosPickerButton}
                                    onPress={handleIOSConfirm}
                                >
                                    <Text style={[styles.iosPickerButtonText, styles.iosPickerButtonTextPrimary]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.iosPickerContainer}>
                                <View style={styles.iosPickerWrapper}>
                                    <View style={[
                                        styles.iosPickerBackground,
                                        colorScheme === 'dark' && styles.iosPickerBackgroundLight
                                    ]}>
                                        <DateTimePicker
                                            value={tempTime}
                                            mode="time"
                                            is24Hour={false}
                                            display="spinner"
                                            onChange={handleTimeChange}
                                            style={styles.iosPicker}
                                            themeVariant={colorScheme === 'dark' ? 'light' : undefined}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default TimePicker;

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
    pickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 48,
    },
    pickerText: {
        fontSize: 16,
        color: Colors.textPrimary,
        flex: 1,
    },
    placeholderText: {
        color: Colors.textSecondary,
    },
    arrow: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 8,
    },
    iosModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    iosModalOverlayTouchable: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    iosModalContent: {
        backgroundColor: Colors.backgroundLight,
        borderRadius: 20,
        paddingBottom: 20,
        width: "90%",
        maxWidth: 400,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iosPickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iosPickerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    iosPickerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minWidth: 60,
    },
    iosPickerButtonText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
    },
    iosPickerButtonTextPrimary: {
        color: Colors.primary,
    },
    iosPickerContainer: {
        backgroundColor: Colors.backgroundLight,
        paddingVertical: 10,
        overflow: "hidden",
    },
    iosPickerWrapper: {
        backgroundColor: Colors.backgroundLight,
        alignItems: "center",
        justifyContent: "center",
    },
    iosPickerBackground: {
        backgroundColor: Colors.backgroundLight,
        borderRadius: 10,
        overflow: "hidden",
    },
    iosPickerBackgroundLight: {
        backgroundColor: Colors.backgroundLight,
    },
    iosPicker: {
        backgroundColor: Colors.backgroundLight,
        height: 200,
        width: 300,
    },
});

