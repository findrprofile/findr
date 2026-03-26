import { fb } from './services/FirebaseService.js';
import { AppRouter } from './controllers/Router.js';
import { DashboardController } from './controllers/DashboardController.js';
import { NotificationController } from './controllers/NotificationController.js';
import { FriendsController } from './controllers/FriendsController.js';
import { ProfileController } from './controllers/ProfileController.js';
import { ViewUserController } from './controllers/ViewUserController.js';
import { EditProfileController } from './controllers/EditProfileController.js';
import { AuthController } from './controllers/AuthController.js';
import { SettingsController } from './controllers/SettingsController.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const app = {
    init() {
        // Initialize controllers
        this.router = new AppRouter(this);
        this.dashboardController = new DashboardController();
        this.friendsController = new FriendsController();
        this.profileController = new ProfileController(this);
        this.viewUserController = new ViewUserController(this);
        this.editController = new EditProfileController(this);
        this.authController = new AuthController(this); 
        this.settingsController = new SettingsController(this);
        
        // BUG FIX: Turn on the Notification Controller
        this.notificationController = new NotificationController(this);
        
        window.app = this; 

        this.setupGlobalListeners();

        // Initialize Firebase Auth
        fb.initAuth((user) => {
            if (user) {
                // BUG FIX: Start listening for friend requests!
                this.notificationController.startListener();
                
                this.dashboardController.start();
                this.router.navigate('dashboard');
            } else {
                this.router.navigate('login');
            }
        });
    },

    setupGlobalListeners() {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if(confirm("Are you sure you want to log out?")) {
                    await signOut(fb.auth);
                    window.location.reload();
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());