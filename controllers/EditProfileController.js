import { fb } from '../services/FirebaseService.js';
import { User } from '../models/User.js';

export class EditProfileController {
    constructor(appInstance) {
        this.app = appInstance;
        this.tempUser = new User(); 
        this.selectedImageFile = null; // Track if they chose a new photo
        
        document.getElementById('btn-back-profile').addEventListener('click', () => this.app.router.navigate('profile'));
        document.getElementById('btn-save-profile').addEventListener('click', () => this.save());

        // Setup the image upload listeners
        this.setupImageUploader();
    }

    setupImageUploader() {
        const clickZone = document.getElementById('avatar-click-zone');
        const fileInput = document.getElementById('avatar-upload-input');
        const preview = document.getElementById('edit-avatar-preview');

        // Clicking the avatar triggers the hidden file input
        clickZone.addEventListener('click', () => fileInput.click());

        // When a file is selected, show a live preview
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Ensure it's an image
                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    return;
                }
                
                // Warn if file is over 5MB
                if (file.size > 5 * 1024 * 1024) {
                    alert('File is too large. Please select an image under 5MB.');
                    return;
                }

                this.selectedImageFile = file;
                // Create a temporary local URL to show the preview instantly
                preview.src = URL.createObjectURL(file);
            }
        });
    }

    mount() {
        this.tempUser = new User(JSON.parse(JSON.stringify(fb.userModel.toFirestore())));
        this.selectedImageFile = null; // Reset any previous un-saved selections
        document.getElementById('avatar-upload-input').value = ""; // Clear file input
        
        document.getElementById('edit-name').value = this.tempUser.name;
        document.getElementById('edit-bio').value = this.tempUser.bio;
        document.getElementById('edit-avatar-preview').src = this.tempUser.avatar;
        
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
                chip.innerHTML = `<span>${tag}</span><button onclick="app.editController.removeTag('${cat}', '${tag}')">✕</button>`;
                cont.appendChild(chip);
            });
        };
        draw('interests', 'orange');
        draw('skills', 'blue');
        draw('hangouts', 'purple');
    }

    async save() {
        const btn = document.getElementById('btn-save-profile');
        const originalText = btn.textContent;
        btn.disabled = true;

        try {
            // STEP 1: If they selected a new image, upload it to Storage FIRST
            if (this.selectedImageFile) {
                btn.textContent = "Uploading Photo...";
                const newAvatarUrl = await fb.uploadAvatar(this.selectedImageFile, fb.currentUser.uid);
                fb.userModel.avatar = newAvatarUrl; // Update the main model
            }

            // STEP 2: Save the rest of the text data to Firestore
            btn.textContent = "Saving Profile...";
            fb.userModel.name = document.getElementById('edit-name').value;
            fb.userModel.bio = document.getElementById('edit-bio').value;
            fb.userModel.tags = this.tempUser.tags;

            await fb.saveMyProfile();
            
            btn.textContent = "Saved!";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                this.app.router.navigate('profile');
            }, 800);

        } catch (error) {
            console.error("Save failed", error);
            btn.textContent = "Error Saving!";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }
}