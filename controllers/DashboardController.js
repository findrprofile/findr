import { fb } from '../services/FirebaseService.js';

export class DashboardController {
    constructor() {
        this.listContainer = document.getElementById('dashboard-users-list');
        this.unsubscribe = null;
    }

    start() {
        this.unsubscribe = fb.listenToVisibleUsersInMyLocation((users) => {
            this.render(users);
        });
    }

    render(users) {
        this.listContainer.innerHTML = '';

        if (users.length === 0) {
            this.listContainer.innerHTML =
                '<p style="color:var(--text-secondary)">No one else is around right now.</p>';
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

            const isFriend = fb.userModel.friendsList.includes(u.uid);

            card.innerHTML = `
                <div class="uc-header">
                    <div class="uc-profile-info">
                        <img src="${u.avatar}" class="uc-avatar" alt="${u.name}'s avatar">
                        <div>
                            <div class="uc-name">${u.name}</div>
                            <div class="uc-location">${u.lastLocation}</div>
                        </div>
                    </div>
                    <div class="uc-actions">
                        ${!isFriend ? `<button class="btn-add" data-uid="${u.uid}">Add +</button>` : ''}
                        <button class="btn-remove">-</button>
                    </div>
                </div>
                <div class="badges-scroll">
                    ${badgesHTML || '<span style="font-size:11px;color:#888;">No badges yet</span>'}
                </div>
            `;

            if (!isFriend) {
                card.querySelector('.btn-add').addEventListener('click', (e) => this.addFriend(u.uid, e.target));
            }

            card.querySelector('.btn-remove').addEventListener('click', () => {
                alert('Hide user feature coming soon.');
            });

            this.listContainer.appendChild(card);
        });
    }

    async addFriend(friendUid, btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Sending...';
        await fb.sendFriendRequest(friendUid);
        btnElement.textContent = 'Sent ✓';
        btnElement.style.background = '#e0f7fa';
        btnElement.style.color = 'var(--bg-dark)';
    }
}