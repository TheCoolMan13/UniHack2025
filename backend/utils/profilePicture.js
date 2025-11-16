/**
 * Profile Picture Utility (Backend)
 * Generates consistent profile picture URLs using Random User Generator API
 */

/**
 * Get profile picture URL for a user
 * Uses the user's ID as a seed to ensure consistency
 * @param {number} userId - User ID
 * @param {string} gender - Optional: 'male' or 'female' (default: random based on ID)
 * @param {string} size - Picture size: 'large', 'medium', or 'thumbnail' (default: 'medium')
 * @returns {string} Profile picture URL
 */
const getProfilePictureUrl = (userId, gender = null, size = 'medium') => {
    if (!userId) {
        return getDefaultProfilePicture();
    }
    
    // Map size to Random User API format
    const sizeMap = {
        'large': 'large',
        'medium': 'med',
        'thumbnail': 'thumb'
    };
    
    const apiSize = sizeMap[size] || 'med';
    
    // Determine gender (use 'men' or 'women', or random based on ID)
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
const getDefaultProfilePicture = () => {
    return 'https://randomuser.me/api/portraits/med/men/1.jpg';
};

module.exports = {
    getProfilePictureUrl,
    getDefaultProfilePicture
};

