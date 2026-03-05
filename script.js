// Firebase initialization is now handled in firebase-config.js (excluded from git)

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const authError = document.getElementById('authError');
    const toggleAuthBtn = document.getElementById('toggleAuth');
    const loginBtn = document.getElementById('loginBtn');

    // Notification bell navigation is handled via HTML <a> tags.

    // Edit Profile button navigation 
    function setupEditProfileButton() {
        const btn = document.getElementById("editProfileBtn");
        if (!btn) return;

        btn.addEventListener("click", () => {
            window.location.href = "edit-profile.html";
        });
    }
    setupEditProfileButton();

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
                // Error messages
                if (error.code === "auth/wrong-password") {
                    authError.textContent = "Invalid password.";
                }
                else if (error.code === "auth/user-not-found") {
                    authError.textContent = "Email is not registered.";
                }
                else if (error.code === "auth/invalid-email") {
                    authError.textContent = "Please enter a valid email address."
                }
                else {
                    authError.textContent = "Login failed. Please try again."
                }
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
                if (error.code === "auth/invalid-email") {
                    authError.textContent = "Please enter a valid email address."
                }
                else if (error.code === "auth/email-already-in-use") {
                    authError.textContent = "Email is already registered."
                }
                else if (error.code === "auth/weak-password") {
                    authError.textContent = "Password must be at least 6 characters."
                }
                else {
                    authError.textContent = "Signup failed. Please try again."
                }
            }
        });
    }

    // --- App Logic ---

    function initApp() {
        // App logic based on page
        const path = window.location.pathname;
        console.log("Initializing app for path:", path);

        if (path.endsWith('index.html') || path.endsWith('/') || path === '') {
            initDashboard();
        } else if (path.includes('friends.html')) {
            initFriendsPage();
        } else if (path.includes('profile.html')) {
            initProfile();
        } else if (path.includes('settings.html')) {
            initSettings();
        } else if (path.includes("edit-profile.html")) {
            initEditProfile();
        } else if (path.includes('notifications.html')) {
            initNotifications();
        } else {
            // Default to dashboard if no match
            console.log("No specific page match, defaulting to dashboard logic");
            initDashboard();
        }
    }

    function initDashboard() {
        // Update location display
        const locDisplay = document.getElementById('currentLocationDisplay');
        if (locDisplay) {
            locDisplay.textContent = "MN";
        }
        console.log("Dashboard initialized");
    }

    function initFriendsPage() {
        renderUsers();
    }

    function initNotifications() {
        const backBtn = document.getElementById("backToPrevious");
        if (backBtn) {
            backBtn.onclick = () => window.history.back();
        }
    }

    async function initSettings() {
        console.log("Settings initialized");
        const locationToggle = document.getElementById('locationToggle');
        const notificationToggle = document.getElementById('notificationToggle');
        const privacyToggle = document.getElementById('privacyToggle');
        const logoutBtn = document.getElementById('logoutBtnFull');

        if (auth.currentUser) {
            const userRef = db.collection('users').doc(auth.currentUser.uid);
            const doc = await userRef.get();
            const userData = doc.exists ? doc.data() : {};

            // Location Toggle logic
            if (locationToggle) {
                if (userData.locationTracking !== undefined) {
                    locationToggle.checked = userData.locationTracking;
                }
                locationToggle.addEventListener('change', async () => {
                    try {
                        await userRef.update({ locationTracking: locationToggle.checked });
                    } catch (e) { console.error(e); }
                });
            }

            // Notification Toggle logic
            if (notificationToggle) {
                if (userData.notificationsEnabled !== undefined) {
                    notificationToggle.checked = userData.notificationsEnabled;
                }
                notificationToggle.addEventListener('change', async () => {
                    try {
                        await userRef.update({ notificationsEnabled: notificationToggle.checked });
                        console.log("Notification preference updated");
                    } catch (e) { console.error(e); }
                });
            }

            // Privacy Toggle logic
            if (privacyToggle) {
                if (userData.privacyMode !== undefined) {
                    privacyToggle.checked = userData.privacyMode;
                }
                privacyToggle.addEventListener('change', async () => {
                    try {
                        await userRef.update({ privacyMode: privacyToggle.checked });
                        console.log("Privacy preference updated");
                    } catch (e) {
                        // Fallback for demo
                        localStorage.setItem('privacyMode', privacyToggle.checked);
                        console.log("Privacy preference saved to local storage");
                    }
                });
            }
        }

        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                if (confirm('Are you sure you want to log out?')) {
                    window.location.href = 'login.html';
                }
            };
        }
    }

    // Render Users from Firestore
    async function renderUsers() {
        const userListEl = document.getElementById('userList');
        if (!userListEl) return;

        userListEl.innerHTML = '<div class="loading-users">Searching for people nearby...</div>';

        try {
            // Only show users who have location tracking enabled (if we were being real)
            // For now, show everyone except self
            const snapshot = await db.collection('users').get();
            userListEl.innerHTML = '';

            snapshot.forEach(doc => {
                const userData = doc.data();
                if (auth.currentUser && userData.email !== auth.currentUser.email) {
                    const card = createUserCard({
                        id: doc.id,
                        name: userData.name || userData.email.split('@')[0],
                        avatar: userData.avatar || '',
                        location: userData.location || 'DV (William G. Davis Building)',
                        time: userData.time || 'Now'
                    });
                    userListEl.appendChild(card);
                }
            });

            // Add Dummy Profiles
            const dummyUsers = [
                {
                    id: 'dummy1',
                    name: 'Yousef Sadiq',
                    location: 'Maanjiwe Nendamowinan',
                    time: '5m ago',
                    interests: ['Video Games', 'Computer Science', 'Library', 'Strength Training', 'UX Design', 'DV', 'Movies']
                },
                {
                    id: 'dummy2',
                    name: 'Sam Chen',
                    location: 'Hazel McCallion Academic Learning Centre',
                    time: '12m ago',
                    interests: ['Art', 'Design', 'Music', 'Hiking']
                },
                {
                    id: 'dummy3',
                    name: 'Jordan Smith',
                    location: 'Deerfield Hall',
                    time: 'Now',
                    interests: ['Coding', 'Coffee', 'Startups']
                }
            ];

            dummyUsers.forEach(user => {
                const card = createUserCard(user);
                userListEl.appendChild(card);
            });
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    function createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'friend-card-v2';
        card.onclick = () => window.location.href = `profile.html?uid=${user.id}`;

        const header = document.createElement('div');
        header.className = 'card-header-v2';

        const avatar = document.createElement('img');
        avatar.className = 'card-avatar-v2';
        avatar.src = user.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0Ij48L2NpcmNsZT48cGF0aCBkPSJNMjAgMjF2LTIgYTQgNCAwIDAgMC00LTRoLTggYTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjwvc3ZnPg==';

        const info = document.createElement('div');
        info.className = 'card-info-v2';

        const name = document.createElement('div');
        name.className = 'card-name-v2';
        name.textContent = user.name;

        info.appendChild(name);
        header.appendChild(avatar);
        header.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'card-actions-v2';
        actions.innerHTML = `
            <button class="btn-card-add" onclick="event.stopPropagation();">Add +</button>
            <div class="btn-card-remove" onclick="event.stopPropagation();">−</div>
        `;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container-v2';

        const tagColors = ['orange', 'blue', 'purple', 'teal', 'magenta', 'dark-blue'];
        const interests = user.interests || ['General'];

        interests.forEach((interest, index) => {
            const tag = document.createElement('span');
            const colorClass = `tag-${tagColors[index % tagColors.length]}`;
            tag.className = `tag-v2 ${colorClass}`;
            tag.textContent = interest;
            tagsContainer.appendChild(tag);
        });

        card.appendChild(header);
        card.appendChild(actions);
        card.appendChild(tagsContainer);

        return card;
    }

    async function initProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        const uid = urlParams.get('uid') || (auth.currentUser ? auth.currentUser.uid : null);

        if (!uid) return;

        const backNav = document.getElementById('backToFriends');
        if (backNav) backNav.onclick = () => window.history.back();

        try {
            const doc = await db.collection('users').doc(uid).get();
            const userData = doc.exists ? doc.data() : { name: "Yousef Sadiq", bio: "Co-Founder of Findr, avid procrastinator." };

            document.getElementById('userNameDisplay').textContent = userData.name || "Yousef Sadiq";

            // Force new demo picture if we are on the demo profile or testing
            if (!userData.avatar || userData.name === "Yousef Sadiq") {
                document.getElementById('userAvatar').src = "youssef-mog.jpg";
            } else {
                document.getElementById('userAvatar').src = userData.avatar;
            }

            document.getElementById('userBioDisplay').textContent = userData.bio || "Co-Founder of Findr, avid procrastinator.";

            // Render categorized tags
            renderCategorizedTags(userData.tags && userData.tags.length > 0 ? userData.tags : [
                "Basketball", "Finance", "Video Games", "Strength Training", "Movies", "Food",
                "Graphic Design", "Math", "Computer Science", "UX Design", "Game Design",
                "Library", "DV", "DH"
            ]);
        } catch (error) {
            console.error("Error loading profile:", error);
        }

        // Connectivity for future uploader
        setupUploader();
    }

    async function initEditProfile() {
        const backBtn = document.getElementById("backToProfile");
        if (backBtn) {
            backBtn.onclick = () => window.location.href = "profile.html";
        }

        if (!auth.currentUser) return;

        // Load existing data
        try {
            const doc = await db.collection("users").doc(auth.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();

                const nameEl = document.getElementById("editName");
                const bioEl = document.getElementById("editBio");
                const programEl = document.getElementById("editProgram");
                const avatarEl = document.getElementById("editAvatar");

                if (nameEl) nameEl.value = data.name || "";
                if (bioEl) bioEl.value = data.bio || "";
                if (programEl) programEl.value = data.program || "None";
                if (avatarEl && data.avatar) avatarEl.src = data.avatar;
            }
        } catch (e) {
            console.error("Failed to load profile for editing:", e);
        }

        // Save handler
        const saveBtn = document.getElementById("saveProfileBtn");
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const name = document.getElementById("editName")?.value ?? "";
                const bio = document.getElementById("editBio")?.value ?? "";
                const program = document.getElementById("editProgram")?.value ?? "None";

                try {
                    await db.collection("users").doc(auth.currentUser.uid).update({
                        name,
                        bio,
                        program
                    });

                    const toast = document.getElementById("saveToast");
                    if (toast) {
                        toast.style.display = "block";
                        toast.textContent = "Changes saved ✓";
                        setTimeout(() => {
                            toast.style.display = "none";
                        }, 2500);
                    }
                } catch (e) {
                    console.error("Failed to save profile changes:", e);
                }
            };
        }
    }

    function renderCategorizedTags(tags) {
        const interestsContainer = document.getElementById('interestsTags');
        const skillsContainer = document.getElementById('skillsTags');
        const hangoutContainer = document.getElementById('hangoutTags');

        if (!interestsContainer) return;

        interestsContainer.innerHTML = '';
        skillsContainer.innerHTML = '';
        hangoutContainer.innerHTML = '';

        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            pill.textContent = tag.text || tag;

            // Simple heuristic for demo
            const lowText = pill.textContent.toLowerCase();
            if (tag.color === 'orange' || ['gaming', 'video games', 'basketball', 'automobiles', 'movies', 'finance', 'strength training'].some(k => lowText.includes(k))) {
                pill.classList.add('orange');
                interestsContainer.appendChild(pill);
            } else if (tag.color === 'blue' || ['math', 'computer science', 'statistics', 'ux design', 'design', 'graphic design'].some(k => lowText.includes(k))) {
                pill.classList.add('blue');
                skillsContainer.appendChild(pill);
            } else {
                pill.classList.add('purple');
                hangoutContainer.appendChild(pill);
            }
        });
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
});
