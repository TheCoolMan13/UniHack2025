import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const MainPage = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>👾 Welcome to NibbleForce 👾</Text>

            <Image
                source={{
                    uri: 'https://i.imgflip.com/7xq3y4.jpg', // funny programming meme
                }}
                style={styles.memeImage}
                resizeMode="contain"
            />

            <Text style={styles.caption}>
                When the code finally runs without errors... 😎
            </Text>

            <Text style={styles.footer}>Powered by the mighty NibbleForce 💪</Text>
        </View>
    );
};

export default MainPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1117',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        fontSize: 22,
        color: '#00ff9d',
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    memeImage: {
        width: '90%',
        height: 250,
        borderRadius: 12,
        marginBottom: 20,
    },
    caption: {
        fontSize: 16,
        color: '#c9d1d9',
        textAlign: 'center',
        marginBottom: 30,
    },
    footer: {
        fontSize: 14,
        color: '#8b949e',
        fontStyle: 'italic',
    },
});
