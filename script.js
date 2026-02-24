// Firebase Configuration (Placeholder - User should replace with their own config)
const firebaseConfig = {
    apiKey: "AIzaSyB4Og7LaXo_Ywu4PAiQqWT-cJGkoiE30Ms",
    authDomain: "findrfirebase-2266a.firebaseapp.com",
    projectId: "findrfirebase-2266a",
    storageBucket: "findrfirebase-2266a.firebasestorage.app",
    messagingSenderId: "324771059735",
    appId: "1:324771059735:web:844951a3f693a3ca6fe452",
    measurementId: "G-V1NM15JQ36"
};

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const authError = document.getElementById('authError');
    const toggleAuthBtn = document.getElementById('toggleAuth');
    const loginBtn = document.getElementById('loginBtn');

    let isLoginMode = true;

    // --- Authentication Logic ---

    // Check Auth State
    auth.onAuthStateChanged(user => {
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') || path.includes('signup.html');

        if (user) {
            console.log("User is logged in:", user.email);
            if (isAuthPage) {
                window.location.href = 'index.html';
            }
            initApp();
        } else {
            console.log("No user logged in.");
            if (!isAuthPage) {
                window.location.href = 'login.html';
            }
        }
    });

    // Handle Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            authError.textContent = '';

            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                console.error("Login Error:", error);
                authError.textContent = error.message;
            }
        });
    }

    // Handle Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const displayName = document.getElementById('displayName').value;
            const authError = document.getElementById('authError');

            authError.textContent = '';

            // Domain Validation
            if (!email.endsWith('@mail.utoronto.ca')) {
                authError.textContent = 'Only @mail.utoronto.ca emails are allowed.';
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                // Create user profile in Firestore
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: email,
                    name: displayName,
                    tags: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error("Signup Error:", error);
                authError.textContent = error.message;
            }
        });
    }

    // --- App Logic ---

    function initApp() {
        // App logic based on page
        const path = window.location.pathname;

        if (document.getElementById('locationName')) {
            initDashboard();
        } else if (path.includes('profile.html')) {
            initProfile();
        }

        setupLogout();
    }

    function initDashboard() {
        // Mock Data (Fallback)
        const mockLocation = {
            name: "MN (Maanjiwe Nendamowinan)",
            shortName: "MN"
        };

        // Initialize App UI
        initLocation(mockLocation);
        renderUsers();
    }

    async function initProfile() {
        const user = auth.currentUser;
        if (!user) return;

        const userNameDisplay = document.getElementById('userNameDisplay');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const userAvatar = document.getElementById('userAvatar');
        const myTagsContainer = document.getElementById('myTags');

        if (userEmailDisplay) userEmailDisplay.textContent = user.email;

        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const userData = doc.data();
                if (userNameDisplay) userNameDisplay.textContent = userData.name || user.email.split('@')[0];
                if (userAvatar && userData.avatar) userAvatar.src = userData.avatar;

                if (myTagsContainer && userData.tags) {
                    myTagsContainer.innerHTML = '';
                    userData.tags.forEach(tag => {
                        const tagEl = document.createElement('span');
                        tagEl.className = `tag ${tag.color || 'blue'}`;
                        tagEl.textContent = tag.text || tag;
                        myTagsContainer.appendChild(tagEl);
                    });
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }

        // Connectivity for future uploader
        setupUploader();
    }

    function setupUploader() {
        const overlay = document.querySelector('.avatar-edit-overlay');
        const placeholder = document.querySelector('.uploader-placeholder');

        const message = () => alert('The uploader is almost ready! We are finishing the Firebase Storage connection.');

        if (overlay) overlay.addEventListener('click', message);
        if (placeholder) placeholder.addEventListener('click', message);
    }

    // Future-proof uploader function
    async function uploadProfileImage(file) {
        if (!auth.currentUser) return;

        const storageRef = storage.ref(`avatars/${auth.currentUser.uid}`);
        try {
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            // Update user document in Firestore
            await db.collection('users').doc(auth.currentUser.uid).update({
                avatar: downloadURL
            });

            return downloadURL;
        } catch (error) {
            console.error("Upload failed:", error);
            throw error;
        }
    }

    // Geolocation Logic
    function initLocation(mockLocation) {
        const locationNameEl = document.getElementById('locationName');
        const locationNameShortEl = document.getElementById('locationNameShort');

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateLocationUI(mockLocation.name, mockLocation.shortName);
                },
                (error) => {
                    updateLocationUI(mockLocation.name, mockLocation.shortName);
                }
            );
        } else {
            updateLocationUI(mockLocation.name, mockLocation.shortName);
        }
    }

    function updateLocationUI(fullName, shortName) {
        if (document.getElementById('locationName')) {
            document.getElementById('locationName').textContent = fullName;
        }
        if (document.getElementById('locationNameShort')) {
            document.getElementById('locationNameShort').textContent = shortName;
        }
    }

    // Render Users from Firestore
    async function renderUsers() {
        const userListEl = document.getElementById('userList');
        if (!userListEl) return;

        userListEl.innerHTML = '<div class="loading-users">Searching for people nearby...</div>';

        try {
            const snapshot = await db.collection('users').limit(10).get();
            userListEl.innerHTML = '';

            if (snapshot.empty) {
                userListEl.innerHTML = '<div class="loading-users">No one nearby yet. Be the first!</div>';
                return;
            }

            snapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.email !== auth.currentUser.email) { // Don't show self
                    const card = createUserCard({
                        id: doc.id,
                        name: userData.name || userData.email.split('@')[0],
                        avatar: userData.avatar || '',
                        tags: userData.tags || []
                    });
                    userListEl.appendChild(card);
                }
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            userListEl.innerHTML = '<div class="loading-users">Error loading users.</div>';
        }
    }

    function createUserCard(user) {
        const container = document.createElement('div');
        container.className = 'user-card-container';

        const header = document.createElement('div');
        header.className = 'user-card-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'user-name';
        nameSpan.textContent = user.name;

        const actions = document.createElement('div');
        actions.className = 'action-buttons';

        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-add';
        btnAdd.textContent = 'Add +';

        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-remove';
        btnRemove.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

        actions.appendChild(btnAdd);
        actions.appendChild(btnRemove);
        header.appendChild(nameSpan);
        header.appendChild(actions);

        const body = document.createElement('div');
        body.className = 'user-card-body';

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';

        user.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = `tag ${tag.color || 'blue'}`;
            tagEl.textContent = tag.text || tag;
            tagsContainer.appendChild(tagEl);
        });

        body.appendChild(tagsContainer);

        const avatar = document.createElement('img');
        avatar.className = 'user-avatar';
        avatar.alt = user.name;
        avatar.src = user.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0Ij48L2NpcmNsZT48cGF0aCBkPSJNMjAgMjF2LTIgYTQgNCAwIDAgMC00LTRoLTggYTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjwvc3ZnPg==';

        container.appendChild(header);
        container.appendChild(body);
        container.appendChild(avatar);

        return container;
    }

    function setupLogout() {
        const settingsTab = document.querySelector('.nav-item:last-child');
        if (settingsTab) {
            settingsTab.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to log out?')) {
                    try {
                        await auth.signOut();
                    } catch (error) {
                        console.error("Logout Error:", error);
                    }
                }
            });
        }
    }
});
