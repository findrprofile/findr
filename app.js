import { fb } from '../services/FirebaseService.js';
import { AppRouter } from '../controllers/Router.js';
import { DashboardController } from '../controllers/DashboardController.js';
import { FriendsController } from '../controllers/FriendsController.js';
import { ProfileController } from '../controllers/ProfileController.js';
import { EditProfileController } from '../controllers/EditProfileController.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const app = {
    init() {
        // Initialize controllers and pass the app instance to those that need routing access
        this.router = new AppRouter(this);
        this.dashboardController = new DashboardController();
        this.friendsController = new FriendsController();
        this.profileController = new ProfileController(this);
        this.editController = new EditProfileController(this);
        
        // Expose app to global window just in case your HTML relies on inline handlers (like the addTag buttons)
        window.app = this; 

        this.setupGlobalListeners();

        // Initialize Firebase Auth - this determines which view to load first
        fb.initAuth((user) => {
            if (user) {
                this.dashboardController.start();
                this.router.navigate('dashboard');
            } else {
                this.router.navigate('login');
            }
        });
    },

    setupGlobalListeners() {
        // Login Button
        const loginBtn = document.getElementById('btn-demo-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                const name = document.getElementById('authName').value || "New Student";
                loginBtn.textContent = "Loading...";
                
                if (fb.userModel) fb.userModel.name = name;
                
                if (fb.currentUser) {
                    await fb.saveMyProfile();
                    this.dashboardController.start();
                    this.router.navigate('dashboard');
                }
            });
        }

        // Logout Button
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

// Start the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => app.init());