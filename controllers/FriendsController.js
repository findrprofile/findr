import { fb } from '../services/FirebaseService.js';
import { getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class FriendsController {
    async render() {
        const container = document.getElementById('friends-list');
        container.innerHTML = '<p style="color:var(--text-secondary);">Loading friends...</p>';
        
        if (!fb.currentUser) return;

        try {
            const snapshot = await getDocs(fb.getUsersCollection());
            container.innerHTML = '';
            let hasFriends = false;

            snapshot.forEach(docSnap => {
                if (fb.userModel.friendsList.includes(docSnap.id)) {
                    hasFriends = true;
                    const u = docSnap.data();
                    const card = document.createElement('div');
                    card.style.cssText = "display:flex; align-items:center; gap:15px; background:white; padding:15px; border-radius:15px; margin-bottom:10px; box-shadow:0 2px 10px rgba(0,0,0,0.05);";
                    
                    card.innerHTML = `
                        <div style="display:flex; align-items:center; gap:15px; flex: 1;">
                            <img src="${u.avatar || 'artwork/Default_Profile_Icon.png'}" alt="${u.name}" style="width:50px; height:50px; border-radius:50%; background:#eee; object-fit:cover;">
                            <div>
                                <div style="font-weight:700;">${u.name}</div>
                                <div style="font-size:12px; color:var(--text-secondary);">${u.lastLocation} • Now</div>
                            </div>
                        </div>
                        <button class="btn-remove-friend" style="background:#fef2f2; color:#ef4444; border:none; padding:8px 12px; border-radius:12px; font-weight:700; font-size: 12px; cursor:pointer;">Remove</button>
                    `;

                    // Wire up the remove button
                    card.querySelector('.btn-remove-friend').addEventListener('click', async () => {
                        if(confirm(`Are you sure you want to remove ${u.name}?`)) {
                            card.style.opacity = '0.5';
                            card.style.pointerEvents = 'none';
                            await fb.removeFriend(docSnap.id);
                            this.render(); // Redraw the friends list!
                        }
                    });

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
        } catch (error) {
            console.error("Error loading friends:", error);
            container.innerHTML = '<p style="color:#ef4444;">Failed to load friends.</p>';
        }
    }
}