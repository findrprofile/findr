import { fb } from '../services/FirebaseService.js';

export class SettingsController {
    constructor() {
        this.locationToggle = document.getElementById('toggle-location-tracking');
        this.privateToggle = document.getElementById('toggle-private-mode');
        this.statusText = document.getElementById('settings-save-status');

        if (this.locationToggle) {
            this.locationToggle.addEventListener('change', () => this.handleLocationToggle());
        }

        if (this.privateToggle) {
            this.privateToggle.addEventListener('change', () => this.handlePrivateToggle());
        }
    }

    render() {
        if (!this.locationToggle || !this.privateToggle) return;

        this.locationToggle.checked = fb.userModel.locationTrackingEnabled;
        this.privateToggle.checked = fb.userModel.privateModeEnabled;
        this.statusText.textContent = '';
    }

    async handleLocationToggle() {
        try {
            fb.userModel.locationTrackingEnabled = this.locationToggle.checked;
            await fb.saveMyPresence();

            this.showSavedMessage("Location tracking updated.");
        } catch (error) {
            console.error(error);
            this.showSavedMessage("Failed to update setting.", true);
        }
    }

    async handlePrivateToggle() {
        try {
            fb.userModel.privateModeEnabled = this.privateToggle.checked;
            await fb.saveMyPresence();

            this.showSavedMessage("Private mode updated.");
        } catch (error) {
            console.error(error);
            this.showSavedMessage("Failed to update setting.", true);
        }
    }

    showSavedMessage(message, isError = false) {
        this.statusText.textContent = message;
        this.statusText.style.color = isError ? 'red' : 'green';

        setTimeout(() => {
            this.statusText.textContent = '';
        }, 1500);
    }
}