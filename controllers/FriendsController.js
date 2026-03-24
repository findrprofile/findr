import { fb } from '../services/FirebaseService.js';
import { getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class FriendsController {
    async render() {
        const container = document.getElementById('friends-list');
        container.innerHTML = '<p style="color:var(--text-secondary);">Loading friends...</p>';
        
        if (!fb.currentUser) return;

        try {
            // Note: In a production app, you'd query specifically for friend UIDs.
            // For this prototype, we're doing a simple fetch and filter.
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
                        <img src="${u.avatar || ''}" alt="${u.name}" style="width:50px; height:50px; border-radius:50%; background:#eee; object-fit:cover;">
                        <div>
                            <div style="font-weight:700;">${u.name}</div>
                            <div style="font-size:12px; color:var(--text-secondary);">${u.lastLocation} • Now</div>
                        </div>
                    `;
                    container.appendChild(card);
                }
            });

            if (!hasFriends) {
                container.innerHTML = '<p style="color:var(--text-secondary)">No friends added yet. Check the dashboard!</p>';
            }
        } catch (error) {
            console.error("Error loading friends:", error);
            container.innerHTML = '<p style="color:#ef4444;">Failed to load friends.</p>';
        }
    }
}