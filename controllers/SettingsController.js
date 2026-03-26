import { fb } from '../services/FirebaseService.js';

export class SettingsController {
    constructor() {
        this.locationToggle = document.getElementById('setting-location-tracking');
        this.privacyToggle = document.getElementById('setting-privacy-mode');
        this.statusText = document.getElementById('settings-save-status');

        this.locationToggle.addEventListener('change', () => this.handleToggle('locationTrackingEnabled', this.locationToggle));
        this.privacyToggle.addEventListener('change', () => this.handleToggle('privacyModeEnabled', this.privacyToggle));
    }

    render() {
        this.locationToggle.checked = fb.userModel.locationTrackingEnabled;
        this.privacyToggle.checked = fb.userModel.privacyModeEnabled;
        this.statusText.textContent = '';
    }

    async handleToggle(fieldName, toggleElement) {
        const previousValue = !toggleElement.checked;

        this.locationToggle.disabled = true;
        this.privacyToggle.disabled = true;
        this.statusText.textContent = 'Saving...';

        try {
            fb.userModel[fieldName] = toggleElement.checked;
            await fb.saveMyProfile();
            this.statusText.textContent = 'Saved';
        } catch (error) {
            console.error(`Failed to save setting "${fieldName}"`, error);
            fb.userModel[fieldName] = previousValue;
            toggleElement.checked = previousValue;
            this.statusText.textContent = 'Could not save settings';
            alert('Failed to save your settings. Please try again.');
        } finally {
            this.locationToggle.disabled = false;
            this.privacyToggle.disabled = false;
        }
    }
}