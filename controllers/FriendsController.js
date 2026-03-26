import { fb } from '../services/FirebaseService.js';
// We completely removed getDocs because we are switching to live listeners!

export class FriendsController {
    constructor() {
        this.unsubscribe = null; // Keeps track of our live connection
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Now';
        const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
        if (diffInSeconds < 60) return 'Now';
        
        const minutes = Math.floor(diffInSeconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    render() {
        const container = document.getElementById('friends-list');
        if (!container) return;
        container.innerHTML = '<p style="color:var(--text-secondary);">Loading friends...</p>';
        
        if (!fb.currentUser) return;

        // 1. Clean up any old listeners so they don't stack up and lag the app
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // 2. THE FIX: Start the live security camera feed!
        this.unsubscribe = fb.listenToAllUsers((users) => {
            
            // Safety check: Don't redraw if they already clicked over to a different tab
            if (window.app.router.currentView !== 'friends') return;

            container.innerHTML = '';
            let hasFriends = false;

            users.forEach(u => {
                // Check if they are in your friends list
                if (fb.userModel.friendsList.includes(u.uid)) {
                    hasFriends = true;
                    const card = document.createElement('div');
                    card.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:15px; background:white; padding:15px; border-radius:15px; margin-bottom:10px; box-shadow:0 2px 10px rgba(0,0,0,0.05);";
                    
                    const timeString = this.formatTimeAgo(u.lastActive);

                    let displayLocation = u.lastLocation || 'Off Campus';
                    
                    // Privacy & Formatting Logic
                    if (u.locationTrackingEnabled === false) {
                        displayLocation = "Off Campus";
                    } else {
                        const locationAbbreviations = {
                            'Maanjiwe Nendamowinan': 'MN',
                            'Instructional Centre': 'IB',
                            'Communication Culture & Technology': 'CC',
                            'The William G. Davis Building': 'DV',
                            'The Kaneff Centre': 'KN',
                            'Terrence Donnelly Health Sciences': 'HB',
                            'U of T Mississauga Library': 'Library',
                            'Deerfield Hall': 'DH',
                            'The Science Building': 'Science'
                        };
                        if (locationAbbreviations[displayLocation]) {
                            displayLocation = locationAbbreviations[displayLocation];
                        }
                    }

                    card.innerHTML = `
                        <div class="friend-profile-info" style="display:flex; align-items:center; gap:15px; flex: 1; cursor: pointer;" title="View Profile">
                            <img src="${u.avatar || 'artwork/Default_Profile_Icon.png'}" alt="${u.name}" style="width:50px; height:50px; border-radius:50%; background:#eee; object-fit:cover; border: 2px solid var(--primary-teal);">
                            <div>
                                <div style="font-weight:700;">${u.name}</div>
                                <div style="font-size:12px; color:var(--text-secondary);">${displayLocation} • ${timeString}</div>
                            </div>
                        </div>
                        <button class="btn-remove-friend" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:12px; font-weight:700; font-size: 12px; cursor:pointer;">Remove</button>
                    `;

                    const profileClickZone = card.querySelector('.friend-profile-info');
                    if (profileClickZone) {
                        profileClickZone.addEventListener('click', () => {
                            window.app.viewUserController.showProfile(u.uid);
                        });
                    }

                    const removeBtn = card.querySelector('.btn-remove-friend');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', async () => {
                            if(confirm(`Are you sure you want to remove ${u.name}?`)) {
                                card.style.opacity = '0.5';
                                card.style.pointerEvents = 'none';
                                await fb.removeFriend(u.uid);
                                this.render(); // Force a clean refresh to drop them from the list
                            }
                        });
                    }

                    container.appendChild(card);
                }
            });

            if (!hasFriends) {
                container.innerHTML = `
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 15px; text-align: center; margin-top: 20px;">
                        <h3 style="margin-bottom: 10px;">No friends yet</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">Head to the Dashboard to see who's around you!</p>
                    </div>`;
            }
        });
    }
}