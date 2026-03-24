import { fb } from '../services/FirebaseService.js';

export class ProfileController {
    constructor(appInstance) {
        this.app = appInstance;
        // Bind the edit button once during setup
        document.getElementById('btn-go-edit').addEventListener('click', () => {
            this.app.router.navigate('edit');
        });
    }

    render() {
        const u = fb.userModel;
        document.getElementById('prof-name').textContent = u.name;
        document.getElementById('prof-bio').textContent = u.bio;
        document.getElementById('prof-avatar').src = u.avatar;

        this.renderBadgeCategory(u.tags.interests, 'prof-tags-interests', 'orange');
        this.renderBadgeCategory(u.tags.skills, 'prof-tags-skills', 'blue');
        this.renderBadgeCategory(u.tags.hangouts, 'prof-tags-hangouts', 'purple');
    }

    renderBadgeCategory(tags, containerId, colorClass) {
        const cont = document.getElementById(containerId);
        cont.innerHTML = '';
        if (!tags || tags.length === 0) {
            cont.innerHTML = '<span style="font-size:12px; color:#999;">None added</span>';
            return;
        }
        tags.forEach(tag => {
            cont.innerHTML += `<span class="badge ${colorClass}">${tag}</span>`;
        });
    }
}