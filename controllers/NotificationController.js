import { fb } from '../services/FirebaseService.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class NotificationController {
    constructor(appInstance) {
        this.app = appInstance;
        this.badge = document.getElementById('notification-badge');
        this.listContainer = document.getElementById('notifications-list');

        // Wire up the bell icon click
        document.getElementById('btn-notifications').addEventListener('click', () => {
            this.app.router.navigate('notifications');
        });
    }

    startListener() {
        // Automatically updates the red badge the second someone adds you!
        fb.listenToMyProfile((userModel) => {
            this.updateBadge(userModel.incomingRequests.length);
            if (this.app.router.currentView === 'notifications') {
                this.render();
            }
        });
    }

    updateBadge(count) {
        if (count > 0) {
            this.badge.style.display = 'flex';
            this.badge.textContent = count;
        } else {
            this.badge.style.display = 'none';
        }
    }

    async render() {
        if (!this.listContainer) return;
        this.listContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Loading requests...</p>';

        const requests = fb.userModel.incomingRequests;

        if (requests.length === 0) {
            this.listContainer.innerHTML = `
                <div style="background: #f9f9f9; padding: 30px; border-radius: 15px; text-align: center; margin-top: 20px;">
                    <h3 style="margin-bottom: 10px;">No new notifications</h3>
                    <p style="color: var(--text-secondary); font-size: 14px;">You don't have any pending friend requests.</p>
                </div>`;
            return;
        }

        this.listContainer.innerHTML = '';

        for (const uid of requests) {
            const targetRef = doc(fb.getUsersCollection(), uid);
            const snap = await getDoc(targetRef);

            if (snap.exists()) {
                const u = snap.data();
                const card = document.createElement('div');
                card.className = 'user-card';
                card.style.display = 'flex';
                card.style.flexDirection = 'row';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'space-between';
                card.style.marginBottom = '10px';

                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${u.avatar || 'artwork/Default_Profile_Icon.png'}" style="width:45px; height:45px; border-radius:50%; border: 2px solid var(--primary-teal); object-fit:cover;">
                        <div>
                            <div style="font-weight:700; font-size:15px;">${u.name}</div>
                            <div style="font-size:12px; color:#a5d6d9;">Sent you a friend request</div>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction: column; gap:6px;">
                        <button class="btn-card-accept" style="background:var(--primary-teal); color:var(--bg-dark); border:none; padding:6px 15px; border-radius:12px; font-weight:700; font-size: 12px; cursor:pointer;">Accept</button>
                        <button class="btn-card-decline" style="background:#ef4444; color:white; border:none; padding:6px 15px; border-radius:12px; font-weight:700; font-size: 12px; cursor:pointer;">Decline</button>
                    </div>
                `;

                card.querySelector('.btn-card-accept').addEventListener('click', () => this.acceptRequest(uid, card));
                card.querySelector('.btn-card-decline').addEventListener('click', () => this.declineRequest(uid, card));

                this.listContainer.appendChild(card);
            }
        }
    }

    async acceptRequest(uid, cardElement) {
        cardElement.style.opacity = '0.5';
        cardElement.style.pointerEvents = 'none';
        await fb.acceptFriendRequest(uid);
    }

    async declineRequest(uid, cardElement) {
        cardElement.style.opacity = '0.5';
        cardElement.style.pointerEvents = 'none';
        await fb.declineFriendRequest(uid);
    }
}