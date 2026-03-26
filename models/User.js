export class User {
    constructor(data = {}) {
        this.uid = data.uid || '';
        this.name = data.name || 'Anonymous Student';
        this.bio = data.bio || 'Studying at UTM.';
        
        let loadedAvatar = data.avatar;
        if (loadedAvatar && loadedAvatar.includes('data:image/svg+xml')) {
            loadedAvatar = null; 
        }
        this.avatar = loadedAvatar || 'artwork/Default_Profile_Icon.png';
        
        this.tags = {
            interests: Array.isArray(data.tags?.interests) ? data.tags.interests : [],
            skills: Array.isArray(data.tags?.skills) ? data.tags.skills : [],
            hangouts: Array.isArray(data.tags?.hangouts) ? data.tags.hangouts : []
        };
        
        this.lastLocation = data.lastLocation || 'Maanjiwe Nendamowinan';
        this.friendsList = Array.isArray(data.friendsList) ? data.friendsList : [];
        this.incomingRequests = Array.isArray(data.incomingRequests) ? data.incomingRequests : [];
        this.outgoingRequests = Array.isArray(data.outgoingRequests) ? data.outgoingRequests : [];

        // New settings with safe defaults for old accounts
        this.locationTrackingEnabled = data.locationTrackingEnabled !== false;
        this.privacyModeEnabled = data.privacyModeEnabled === true;
    }

    addTag(category, tagText) {
        const text = tagText.trim();
        if (!text || !this.tags[category]) return false;
        if (this.tags[category].length >= 7) {
            alert(`Maximum 7 tags allowed for ${category}`);
            return false;
        }
        if (!this.tags[category].includes(text)) {
            this.tags[category].push(text);
            return true;
        }
        return false;
    }

    removeTag(category, tagText) {
        if (this.tags[category]) {
            this.tags[category] = this.tags[category].filter(t => t !== tagText);
        }
    }

    toFirestore() {
        return {
            name: this.name,
            bio: this.bio,
            avatar: this.avatar,
            tags: this.tags,
            lastLocation: this.lastLocation,
            friendsList: this.friendsList,
            incomingRequests: this.incomingRequests,
            outgoingRequests: this.outgoingRequests,
            locationTrackingEnabled: this.locationTrackingEnabled,
            privacyModeEnabled: this.privacyModeEnabled
        };
    }
}