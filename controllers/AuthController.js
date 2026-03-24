import { fb } from '../services/FirebaseService.js';

export class AuthController {
    constructor(appInstance) {
        this.app = appInstance;
        this.isLoginMode = true;
        
        this.emailInput = document.getElementById('authEmail');
        this.passwordInput = document.getElementById('authPassword');
        this.nameInput = document.getElementById('authName');
        this.nameGroup = document.getElementById('nameGroup');
        this.submitBtn = document.getElementById('btn-auth-submit');
        this.errorDisplay = document.getElementById('authError');
        
        // Toggle between Login and Signup
        document.getElementById('btn-toggle-auth').addEventListener('click', () => this.toggleMode());
        
        // Handle Submit
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.errorDisplay.textContent = '';
        
        if (this.isLoginMode) {
            this.nameGroup.style.display = 'none';
            this.submitBtn.textContent = 'Sign In';
            document.getElementById('auth-toggle-text').textContent = "Don't have an account?";
            document.getElementById('btn-toggle-auth').textContent = "Create Account";
        } else {
            this.nameGroup.style.display = 'block';
            this.submitBtn.textContent = 'Create Account';
            document.getElementById('auth-toggle-text').textContent = "Already have an account?";
            document.getElementById('btn-toggle-auth').textContent = "Sign In";
        }
    }

    async handleSubmit() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const name = this.nameInput.value.trim();
        
        this.errorDisplay.textContent = '';

        // Your original UofT validation!
        if (!email.endsWith('@mail.utoronto.ca')) {
            this.errorDisplay.textContent = 'Only @mail.utoronto.ca emails are allowed.';
            return;
        }

        if (password.length < 6) {
            this.errorDisplay.textContent = 'Password must be at least 6 characters.';
            return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.textContent = "Processing...";

        try {
            if (this.isLoginMode) {
                await fb.login(email, password);
            } else {
                if (!name) throw new Error("Please enter your name.");
                await fb.signup(email, password, name);
            }
            
            // On success, the Auth listener in app.js will automatically route to the dashboard
        } catch (error) {
            console.error("Auth Error:", error);
            if (error.code === "auth/invalid-credential") {
                this.errorDisplay.textContent = "Invalid email or password.";
            } else if (error.code === "auth/email-already-in-use") {
                this.errorDisplay.textContent = "Email is already registered.";
            } else {
                this.errorDisplay.textContent = error.message || "Authentication failed.";
            }
            
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = this.isLoginMode ? 'Sign In' : 'Create Account';
        }
    }
}