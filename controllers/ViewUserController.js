import { fb } from '../services/FirebaseService.js';

export class ViewUserController {
    constructor(appInstance) {
        this.app = appInstance;
        this.previousView = 'dashboard'; // Default fallback
    }

    async showProfile(uid) {
        // 1. Save the current screen BEFORE we switch to the profile view
        if (this.app.router.currentView && this.app.router.currentView !== 'user-profile') {
            this.previousView = this.app.router.currentView;
        }

        // 2. Override the HTML back button to send you back to that exact screen
        const backBtn = document.querySelector('#view-user-profile .btn-back');
        if (backBtn) {
            backBtn.onclick = () => this.app.router.navigate(this.previousView);
        }

        // 3. Immediately switch the screen
        this.app.router.navigate('user-profile');
        
        // 4. Set temporary loading text
        document.getElementById('public-prof-name').textContent = "Loading...";
        document.getElementById('public-prof-bio').textContent = "";
        document.getElementById('public-prof-avatar').src = "artwork/Default_Profile_Icon.png";
        
        // 5. Fetch data from Firebase
        const userData = await fb.getUserProfile(uid);
        if (!userData) return;

        // 6. Fill in the specific user's info
        document.getElementById('public-prof-name').textContent = userData.name || "Anonymous Student";
        document.getElementById('public-prof-bio').textContent = userData.bio || "Studying at UTM.";
        document.getElementById('public-prof-avatar').src = userData.avatar || 'artwork/Default_Profile_Icon.png';

        // 7. Render their badges
        const renderBadges = (containerId, arr, colorClass) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            if (!arr || arr.length === 0) {
                container.innerHTML = '<span style="font-size:12px; color:--bg-light;">No badges yet</span>';
                return;
            }
            arr.forEach(tag => {
                container.innerHTML += `<span class="badge ${colorClass}">${tag}</span>`;
            });
        };

        const tags = userData.tags || {};
        renderBadges('public-tags-interests', tags.interests, 'orange');
        renderBadges('public-tags-skills', tags.skills, 'blue');
        renderBadges('public-tags-hangouts', tags.hangouts, 'purple');
    }
}