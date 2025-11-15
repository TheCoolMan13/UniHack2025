import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../../constants/colors";
import Button from "../../../components/common/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Onboarding Screen
 * Welcome slides introducing the car sharing app
 */

const OnboardingScreen = () => {
    const navigation = useNavigation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollViewRef = useRef(null);

    const slides = [
        {
            title: "Share Rides, Save Money",
            description: "Find people going your way and share the cost of your daily commute.",
            emoji: "🚗",
        },
        {
            title: "Smart Route Matching",
            description: "Our algorithm finds the perfect ride matches based on your route and schedule.",
            emoji: "🗺️",
        },
        {
            title: "Safe & Reliable",
            description: "Connect with verified drivers and passengers in your community.",
            emoji: "✅",
        },
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            const nextSlide = currentSlide + 1;
            setCurrentSlide(nextSlide);
            scrollViewRef.current?.scrollTo({
                x: nextSlide * SCREEN_WIDTH,
                animated: true,
            });
        } else {
            navigation.navigate("Login");
        }
    };

    const handleSkip = () => {
        navigation.navigate("Login");
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                onMomentumScrollEnd={(event) => {
                    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setCurrentSlide(slideIndex);
                }}
            >
                {slides.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <View style={styles.content}>
                            <Text style={styles.emoji}>{slide.emoji}</Text>
                            <Text style={styles.title}>{slide.title}</Text>
                            <Text style={styles.description}>{slide.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.indicatorContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                currentSlide === index && styles.indicatorActive,
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.buttonContainer}>
                    {currentSlide < slides.length - 1 ? (
                        <>
                            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>
                            <Button title="Next" onPress={handleNext} style={styles.nextButton} />
                        </>
                    ) : (
                        <Button
                            title="Get Started"
                            onPress={handleNext}
                            style={styles.getStartedButton}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLight,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    content: {
        alignItems: "center",
    },
    emoji: {
        fontSize: 80,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.textPrimary,
        textAlign: "center",
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: 50,
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 32,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.border,
        marginHorizontal: 4,
    },
    indicatorActive: {
        backgroundColor: Colors.primary,
        width: 24,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    skipButton: {
        padding: 12,
    },
    skipText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    nextButton: {
        flex: 1,
        marginLeft: 16,
    },
    getStartedButton: {
        width: "100%",
    },
});

