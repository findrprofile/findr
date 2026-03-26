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
        this.forgotPasswordBtn = document.getElementById('btn-forgot-password');
        
        // Toggle between Login and Signup
        document.getElementById('btn-toggle-auth').addEventListener('click', () => this.toggleMode());
        
        // Handle Submit
        this.submitBtn.addEventListener('click', () => this.handleSubmit());

        // Handle password reset
        if (this.forgotPasswordBtn) {
            this.forgotPasswordBtn.addEventListener('click', () => this.handleForgotPassword());
        }
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.errorDisplay.textContent = '';
        this.errorDisplay.style.color = '#ef4444';
        
        if (this.isLoginMode) {
            this.nameGroup.style.display = 'none';
            this.submitBtn.textContent = 'Sign In';
            document.getElementById('auth-toggle-text').textContent = "Don't have an account?";
            document.getElementById('btn-toggle-auth').textContent = "Create Account";
            if (this.forgotPasswordBtn) this.forgotPasswordBtn.style.display = 'inline';
        } else {
            this.nameGroup.style.display = 'block';
            this.submitBtn.textContent = 'Create Account';
            document.getElementById('auth-toggle-text').textContent = "Already have an account?";
            document.getElementById('btn-toggle-auth').textContent = "Sign In";
            if (this.forgotPasswordBtn) this.forgotPasswordBtn.style.display = 'none';
        }
    }

    async handleSubmit() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const name = this.nameInput.value.trim();
        
        this.errorDisplay.textContent = '';
        this.errorDisplay.style.color = '#ef4444';

        // Your original UofT validation
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

    async handleForgotPassword() {
        const email = this.emailInput.value.trim();
        this.errorDisplay.textContent = '';

        if (!email) {
            this.errorDisplay.textContent = 'Enter your email first, then click "Forgot password?"';
            return;
        }

        if (!email.endsWith('@mail.utoronto.ca')) {
            this.errorDisplay.textContent = 'Only @mail.utoronto.ca emails are allowed.';
            return;
        }

        const originalText = this.forgotPasswordBtn ? this.forgotPasswordBtn.textContent : '';

        try {
            if (this.forgotPasswordBtn) {
                this.forgotPasswordBtn.style.pointerEvents = 'none';
                this.forgotPasswordBtn.textContent = 'Sending...';
            }

            await fb.sendPasswordReset(email);
            this.errorDisplay.style.color = '#16a34a';
            this.errorDisplay.textContent = 'Password reset email sent. Check your inbox and spam folders.';
        } catch (error) {
            console.error("Password Reset Error:", error);
            this.errorDisplay.style.color = '#ef4444';

            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                this.errorDisplay.textContent = 'Could not send reset email for that account.';
            } else {
                this.errorDisplay.textContent = 'Failed to send reset email. Please try again.';
            }
        } finally {
            if (this.forgotPasswordBtn) {
                this.forgotPasswordBtn.style.pointerEvents = 'auto';
                this.forgotPasswordBtn.textContent = originalText || 'Forgot password?';
            }
        }
    }
}