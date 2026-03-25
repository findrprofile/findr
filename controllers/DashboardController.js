import { fb } from '../services/FirebaseService.js';

export class DashboardController {
    constructor() {
        this.listContainer = document.getElementById('dashboard-users-list');
        this.unsubscribe = null;
    }

    start() {
        this.unsubscribe = fb.listenToAllUsers((users) => {
            this.render(users);
        });
    }

    render(users) {
        this.listContainer.innerHTML = '';
        if (users.length === 0) {
            this.listContainer.innerHTML = '<p style="color:var(--text-secondary)">No one else is around right now.</p>';
            return;
        }

        users.forEach(u => {
            const card = document.createElement('div');
            card.className = 'user-card';
            
            let badgesHTML = '';
            const renderBadges = (arr, colorClass) => {
                arr.forEach(tag => badgesHTML += `<span class="badge ${colorClass}">${tag}</span>`);
            };
            renderBadges(u.tags.interests, 'orange');
            renderBadges(u.tags.skills, 'blue');
            renderBadges(u.tags.hangouts, 'purple');

            // --- THE FIX: Check all 3 relationship states ---
            const isFriend = fb.userModel.friendsList.includes(u.uid);
            const isPending = fb.userModel.outgoingRequests.includes(u.uid);

            let actionButtonHTML = '';
            if (isFriend) {
                actionButtonHTML = `<span style="font-size: 12px; color: var(--primary-teal); font-weight: 700;">Friends</span>`;
            } else if (isPending) {
                actionButtonHTML = `<button disabled style="background:#e0f7fa; color:var(--bg-dark); border:none; padding:6px 15px; border-radius:20px; font-weight:700; font-size:12px;">Sent ✓</button>`;
            } else {
                actionButtonHTML = `<button class="btn-add" style="background:var(--primary-teal); color:var(--bg-dark); border:none; padding:6px 15px; border-radius:20px; font-weight:700; font-size:12px; cursor:pointer;">Add +</button>`;
            }
            // ------------------------------------------------

            card.innerHTML = `
                <div class="uc-header">
                    <div class="uc-profile-info">
                        <img src="${u.avatar || 'artwork/Default_Profile_Icon.png'}" class="uc-avatar" alt="${u.name}'s avatar">
                        <div>
                            <div class="uc-name">${u.name}</div>
                            <div class="uc-location">${u.lastLocation}</div>
                        </div>
                    </div>
                    <div class="uc-actions">
                        ${actionButtonHTML}
                    </div>
                </div>
                <div class="badges-scroll">
                    ${badgesHTML || '<span style="font-size:11px;color:#888;">No badges yet</span>'}
                </div>
            `;

            const addBtn = card.querySelector('.btn-add');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => this.addFriend(u.uid, e.target));
            }

            this.listContainer.appendChild(card);
        });
    }

    async addFriend(friendUid, btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Sending...';
        await fb.sendFriendRequest(friendUid);
        // We no longer need to manually change it to "Sent ✓" here!
        // Firebase will instantly trigger the render loop and draw the new Pending button.
    }
}