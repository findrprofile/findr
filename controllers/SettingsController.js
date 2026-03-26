import { fb } from '../services/FirebaseService.js';

export class SettingsController {
    constructor(appInstance) {
        this.app = appInstance;
        this.locToggle = document.getElementById('toggle-location');
        this.privToggle = document.getElementById('toggle-private');

        // Load the user's current settings when they click the Settings nav icon
        const settingsNavBtn = document.querySelector('.nav-item[data-target="settings"]');
        if (settingsNavBtn) {
            settingsNavBtn.addEventListener('click', () => this.loadSettings());
        }

        // Save immediately when toggled
        this.locToggle.addEventListener('change', () => this.updateSettings());
        this.privToggle.addEventListener('change', () => this.updateSettings());
    }

    loadSettings() {
        if (!fb.userModel) return;
        // Check the boxes if the database says true!
        this.locToggle.checked = fb.userModel.locationTrackingEnabled !== false; 
        this.privToggle.checked = fb.userModel.privateModeEnabled === true;
    }

    async updateSettings() {
        if (!fb.userModel) return;
        
        // Remember what the setting was BEFORE they clicked it
        const wasLocationOff = fb.userModel.locationTrackingEnabled === false;
        const isNowOff = !this.locToggle.checked;

        fb.userModel.locationTrackingEnabled = this.locToggle.checked;
        fb.userModel.privateModeEnabled = this.privToggle.checked;
        
        if (isNowOff) {
            fb.userModel.lastLocation = "Off Campus";
            
            // 1. Kill the browser's GPS tracker to save battery and stop tracking
            if (window.app.dashboardController.watchId) {
                navigator.geolocation.clearWatch(window.app.dashboardController.watchId);
                window.app.dashboardController.watchId = null;
            }
            // 2. Instantly wipe the dashboard clean
            window.app.dashboardController.setUIState("Location Disabled");
            
        } else if (wasLocationOff && !isNowOff) {
            // 3. They just turned it back ON! Reboot the GPS engine instantly
            window.app.dashboardController.currentLocationState = "Searching";
            window.app.dashboardController.setUIState("Searching");
            window.app.dashboardController.locateUser();
        }
        
        await fb.saveMyProfile();
    }
}