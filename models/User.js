export class User {
    constructor(data = {}) {
        this.uid = data.uid || '';
        this.name = data.name || 'Anonymous Student';
        this.bio = data.bio || 'Studying at UTM.';
        this.avatar = data.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2QzZDNkIiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCI+PC9jaXJjbGU+PHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRoLThhNCA0IDAgMCAwLTQgNHYyIj48L3BhdGg+PC9zdmc+';
        
        this.tags = {
            interests: Array.isArray(data.tags?.interests) ? data.tags.interests : [],
            skills: Array.isArray(data.tags?.skills) ? data.tags.skills : [],
            hangouts: Array.isArray(data.tags?.hangouts) ? data.tags.hangouts : []
        };
        
        this.lastLocation = data.lastLocation || 'Maanjiwe Nendamowinan';
        this.friendsList = Array.isArray(data.friendsList) ? data.friendsList : [];
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
            friendsList: this.friendsList
        };
    }
}