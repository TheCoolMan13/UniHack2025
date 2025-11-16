/**
 * Profile Picture Utility
 * Generates consistent profile picture URLs using Random User Generator API
 * Based on user ID to ensure the same user always gets the same picture
 */

/**
 * Get profile picture URL for a user
 * Uses the user's ID as a seed to ensure consistency
 * @param {number|string} userId - User ID
 * @param {string} gender - Optional: 'male' or 'female' (default: random)
 * @param {string} size - Picture size: 'large', 'medium', or 'thumbnail' (default: 'medium')
 * @returns {string} Profile picture URL
 */
export const getProfilePictureUrl = (userId, gender = null, size = 'medium') => {
    if (!userId) {
        // Return a default placeholder if no user ID
        return getDefaultProfilePicture();
    }
    
    // Use user ID as seed to ensure same user always gets same picture
    // Random User API supports seeds, but we'll use a deterministic approach
    // by using the user ID to select from available portraits
    
    // Map size to Random User API format
    const sizeMap = {
        'large': 'large',
        'medium': 'med',
        'thumbnail': 'thumb'
    };
    
    const apiSize = sizeMap[size] || 'med';
    
    // Determine gender (use 'men' or 'women', or random)
    let genderPath = 'men';
    if (gender === 'female') {
        genderPath = 'women';
    } else if (gender === 'male') {
        genderPath = 'men';
    } else {
        // Use user ID to deterministically choose gender
        genderPath = (parseInt(userId) % 2 === 0) ? 'women' : 'men';
    }
    
    // Use user ID to select a portrait number (1-99 available)
    // This ensures the same user always gets the same picture
    const portraitNumber = (parseInt(userId) % 99) + 1;
    
    // Return Random User API portrait URL
    return `https://randomuser.me/api/portraits/${apiSize}/${genderPath}/${portraitNumber}.jpg`;
};

/**
 * Get default profile picture (placeholder)
 * @returns {string} Default profile picture URL
 */
export const getDefaultProfilePicture = () => {
    return 'https://randomuser.me/api/portraits/med/men/1.jpg';
};

/**
 * Generate a random profile picture URL (for new users)
 * @param {string} gender - Optional: 'male' or 'female'
 * @returns {Promise<string>} Profile picture URL
 */
export const generateRandomProfilePicture = async (gender = null) => {
    try {
        // Use Random User API to get a random user
        const genderParam = gender ? `&gender=${gender}` : '';
        const response = await fetch(`https://randomuser.me/api/?inc=picture${genderParam}`);
        const data = await response.json();
        
        if (data.results && data.results[0] && data.results[0].picture) {
            return data.results[0].picture.medium || data.results[0].picture.large;
        }
    } catch (error) {
        console.error('Error generating random profile picture:', error);
    }
    
    // Fallback to default
    return getDefaultProfilePicture();
};

