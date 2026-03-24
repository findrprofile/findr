import { fb } from '../services/FirebaseService.js';
import { User } from '../models/User.js';

export class EditProfileController {
    constructor(appInstance) {
        this.app = appInstance;
        this.tempUser = new User(); // We edit a copy, not the real data, until "Save" is clicked
        
        document.getElementById('btn-back-profile').addEventListener('click', () => this.app.router.navigate('profile'));
        document.getElementById('btn-save-profile').addEventListener('click', () => this.save());
    }

    mount() {
        // Deep copy the current user model so we don't accidentally save unsaved changes
        this.tempUser = new User(JSON.parse(JSON.stringify(fb.userModel.toFirestore())));
        
        document.getElementById('edit-name').value = this.tempUser.name;
        document.getElementById('edit-bio').value = this.tempUser.bio;
        
        this.renderEditTags();
    }

    addTag(category) {
        const input = document.getElementById(`input-${category}`);
        const success = this.tempUser.addTag(category, input.value);
        if (success) {
            input.value = '';
            this.renderEditTags();
        }
    }

    removeTag(category, tagText) {
        this.tempUser.removeTag(category, tagText);
        this.renderEditTags();
    }

    renderEditTags() {
        const draw = (cat, colorClass) => {
            const cont = document.getElementById(`edit-tags-${cat}`);
            cont.innerHTML = '';
            this.tempUser.tags[cat].forEach(tag => {
                const chip = document.createElement('div');
                chip.className = `editable-chip badge ${colorClass}`;
                
                const span = document.createElement('span');
                span.textContent = tag;
                
                const btn = document.createElement('button');
                btn.textContent = '✕';
                btn.addEventListener('click', () => this.removeTag(cat, tag));

                chip.appendChild(span);
                chip.appendChild(btn);
                cont.appendChild(chip);
            });
        };
        draw('interests', 'orange');
        draw('skills', 'blue');
        draw('hangouts', 'purple');
    }

    async save() {
        // Push temp data back to the main Firebase service model
        fb.userModel.name = document.getElementById('edit-name').value;
        fb.userModel.bio = document.getElementById('edit-bio').value;
        fb.userModel.tags = this.tempUser.tags;

        const btn = document.getElementById('btn-save-profile');
        const originalText = btn.textContent;
        btn.textContent = "Saving...";
        btn.disabled = true;

        try {
            await fb.saveMyProfile();
            btn.textContent = "Saved!";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                this.app.router.navigate('profile');
            }, 800);
        } catch (error) {
            console.error("Save failed", error);
            btn.textContent = "Error!";
            btn.disabled = false;
        }
    }
}