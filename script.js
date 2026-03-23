// Firebase initialization is now handled in firebase-config.js (excluded from git)


document.addEventListener('DOMContentLoaded', async () => {
    // ─── All available tags — defined FIRST so they're always available ────────
    const ALL_TAGS = {
        interests: [
            'Basketball', 'Soccer', 'Tennis', 'Running', 'Hiking',
            'Video Games', 'Movies', 'Music', 'Reading', 'Photography',
            'Finance', 'Food', 'Strength Training', 'Yoga', 'Cooking',
            'Automobiles', 'Fashion', 'Travel', 'Gaming', 'Anime'
        ],
        skills: [
            'Computer Science', 'Math', 'Statistics', 'Physics', 'Biology',
            'Chemistry', 'UX Design', 'Graphic Design', 'Game Design',
            'Web Development', 'Data Science', 'Machine Learning',
            'Economics', 'Psychology', 'Business', 'Marketing', 'Finance',
            'Architecture', 'Art', 'Writing'
        ],
        hangout: [
            'Library', 'DV', 'DH', 'Maanjiwe Nendamowinan', 'Hazel McCallion',
            'RAWC', 'Cafeteria', 'Innovation Complex', 'Student Centre',
            'CCT Building', 'Online / Discord', 'Off-Campus', 'Tim Hortons'
        ]
    };

    // Ensure login is required for each session
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    } catch (e) {
        console.error("Persistence error:", e);
    }

    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const authError = document.getElementById('authError');

    // Edit Profile button navigation
    function setupEditProfileButton() {
        const btn = document.getElementById("editProfileBtn");
        if (!btn) return;
        btn.addEventListener("click", () => {
            window.location.href = "edit-profile.html";
        });
    }
    setupEditProfileButton();

    let justLoggedIn = false;

    // --- Authentication Logic ---

    auth.onAuthStateChanged(async user => {
        const path = window.location.pathname;
        const isLoginPage = path.includes('login.html');
        const isSignupPage = path.includes('signup.html');
        const isAuthPage = isLoginPage || isSignupPage;

        console.log("Auth state changed. User:", user ? user.email : "None", "Path:", path);

        if (user) {
            if (isLoginPage && !justLoggedIn) {
                console.log("Forcing re-login: signing out existing session...");
                await auth.signOut();
                return;
            }

            if (isAuthPage) {
                console.log("Redirecting to dashboard...");
                justLoggedIn = false;
                sessionStorage.setItem('findr_authed', '1');
                window.location.href = 'index.html';
                return;
            }
            sessionStorage.setItem('findr_authed', '1');
            initApp();
        } else {
            const isHomePage = path.endsWith('index.html') || path.endsWith('/') || path === '';
            if (!isAuthPage && !isHomePage) {
                console.log("Not on auth page and not logged in, redirecting to login...");
                window.location.href = 'login.html';
            } else if (isHomePage) {
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
                justLoggedIn = true;
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                justLoggedIn = false;
                console.error("Login Error:", error);
                if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                    authError.textContent = "Invalid email or password.";
                } else if (error.code === "auth/user-not-found") {
                    authError.textContent = "Email is not registered.";
                } else if (error.code === "auth/invalid-email") {
                    authError.textContent = "Please enter a valid email address.";
                } else {
                    authError.textContent = "Login failed. Please try again.";
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

            if (!email.endsWith('@mail.utoronto.ca')) {
                authError.textContent = 'Only @mail.utoronto.ca emails are allowed.';
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: email,
                    name: displayName,
                    bio: '',
                    program: 'None',
                    tags: [],
                    avatar: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error("Signup Error:", error);
                if (error.code === "auth/invalid-email") {
                    authError.textContent = "Please enter a valid email address.";
                } else if (error.code === "auth/email-already-in-use") {
                    authError.textContent = "Email is already registered.";
                } else if (error.code === "auth/weak-password") {
                    authError.textContent = "Password must be at least 6 characters.";
                } else {
                    authError.textContent = "Signup failed. Please try again.";
                }
            }
        });
    }

    // --- App Logic ---

    function initApp() {
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
            initDashboard();
        }
    }

    function initDashboard() {
        const locDisplay = document.getElementById('currentLocationDisplay');
        if (locDisplay) locDisplay.textContent = "MN";
        console.log("Dashboard initialized");
    }

    function initNotifications() {
        const backBtn = document.getElementById("backToPrevious");
        if (backBtn) backBtn.onclick = () => window.history.back();
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

            if (locationToggle) {
                if (userData.locationTracking !== undefined) locationToggle.checked = userData.locationTracking;
                locationToggle.addEventListener('change', async () => {
                    try { await userRef.update({ locationTracking: locationToggle.checked }); } catch (e) { console.error(e); }
                });
            }

            if (notificationToggle) {
                if (userData.notificationsEnabled !== undefined) notificationToggle.checked = userData.notificationsEnabled;
                notificationToggle.addEventListener('change', async () => {
                    try { await userRef.update({ notificationsEnabled: notificationToggle.checked }); } catch (e) { console.error(e); }
                });
            }

            if (privacyToggle) {
                if (userData.privacyMode !== undefined) privacyToggle.checked = userData.privacyMode;
                privacyToggle.addEventListener('change', async () => {
                    try { await userRef.update({ privacyMode: privacyToggle.checked }); } catch (e) {
                        localStorage.setItem('privacyMode', privacyToggle.checked);
                    }
                });
            }
        }

        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                if (confirm('Are you sure you want to log out?')) {
                    try {
                        await auth.signOut();
                        sessionStorage.removeItem('findr_authed');
                        window.location.href = 'login.html';
                    } catch (error) {
                        alert("Failed to log out. Please try again.");
                    }
                }
            };
        }
    }

    // ─── FRIENDS SYSTEM ────────────────────────────────────────────────────────

    /**
     * Returns a map of { [uid]: 'pending_outgoing' | 'pending_incoming' | 'accepted' }
     * for all users this person has a relationship with.
     */
    async function getFriendStatuses() {
        if (!auth.currentUser) return {};
        const myUid = auth.currentUser.uid;
        const snap = await db.collection('users').doc(myUid).collection('friends').get();
        const map = {};
        snap.forEach(doc => {
            const data = doc.data();
            if (data.status === 'accepted') {
                map[doc.id] = 'accepted';
            } else if (data.status === 'pending') {
                // if I initiated, it's outgoing; otherwise incoming
                map[doc.id] = data.initiator === myUid ? 'pending_outgoing' : 'pending_incoming';
            }
        });
        return map;
    }

    async function sendFriendRequest(targetUid) {
        if (!auth.currentUser) return;
        const myUid = auth.currentUser.uid;
        const batch = db.batch();

        // My record: I initiated
        batch.set(
            db.collection('users').doc(myUid).collection('friends').doc(targetUid),
            { status: 'pending', initiator: myUid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
        );
        // Their record: they received
        batch.set(
            db.collection('users').doc(targetUid).collection('friends').doc(myUid),
            { status: 'pending', initiator: myUid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
        );

        await batch.commit();
    }

    async function acceptFriendRequest(fromUid) {
        if (!auth.currentUser) return;
        const myUid = auth.currentUser.uid;
        const batch = db.batch();

        batch.update(
            db.collection('users').doc(myUid).collection('friends').doc(fromUid),
            { status: 'accepted', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
        );
        batch.update(
            db.collection('users').doc(fromUid).collection('friends').doc(myUid),
            { status: 'accepted', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
        );

        await batch.commit();
    }

    async function removeFriend(targetUid) {
        if (!auth.currentUser) return;
        const myUid = auth.currentUser.uid;
        const batch = db.batch();

        batch.delete(db.collection('users').doc(myUid).collection('friends').doc(targetUid));
        batch.delete(db.collection('users').doc(targetUid).collection('friends').doc(myUid));

        await batch.commit();
    }

    // ─── FRIENDS PAGE ───────────────────────────────────────────────────────────

    async function initFriendsPage() {
        const discoverTab = document.getElementById('tabDiscover');
        const myFriendsTab = document.getElementById('tabMyFriends');
        const discoverPanel = document.getElementById('panelDiscover');
        const myFriendsPanel = document.getElementById('panelMyFriends');

        function switchTab(tab) {
            if (tab === 'discover') {
                discoverTab.classList.add('active');
                myFriendsTab.classList.remove('active');
                discoverPanel.style.display = '';
                myFriendsPanel.style.display = 'none';
            } else {
                myFriendsTab.classList.add('active');
                discoverTab.classList.remove('active');
                myFriendsPanel.style.display = '';
                discoverPanel.style.display = 'none';
            }
        }

        if (discoverTab) discoverTab.addEventListener('click', () => switchTab('discover'));
        if (myFriendsTab) myFriendsTab.addEventListener('click', () => switchTab('my-friends'));

        await renderDiscover();
        await renderMyFriends();
        await renderIncomingRequests();
    }

    async function renderDiscover() {
        const userListEl = document.getElementById('userList');
        if (!userListEl) return;

        userListEl.innerHTML = '<div class="loading-users">Searching for people nearby...</div>';

        try {
            const friendStatuses = await getFriendStatuses();
            const snapshot = await db.collection('users').get();
            userListEl.innerHTML = '';

            snapshot.forEach(doc => {
                const userData = doc.data();
                if (auth.currentUser && doc.id !== auth.currentUser.uid) {
                    const status = friendStatuses[doc.id] || null;
                    const card = createUserCard({
                        id: doc.id,
                        name: userData.name || userData.email.split('@')[0],
                        avatar: userData.avatar || '',
                        location: userData.location || 'UTM Campus',
                        time: userData.time || 'Now',
                        interests: userData.tags && userData.tags.length > 0
                            ? userData.tags.map(t => typeof t === 'object' ? t.text : t)
                            : ['UTM Student']
                    }, status, friendStatuses);
                    userListEl.appendChild(card);
                }
            });

            // Dummy profiles (only shown if no real users besides self)
            if (userListEl.children.length === 0) {
                const dummyUsers = [
                    { id: 'dummy1', name: 'Yousef Sadiq', location: 'Maanjiwe Nendamowinan', time: '5m ago', interests: ['Video Games', 'Computer Science', 'Library', 'Strength Training', 'UX Design', 'DV', 'Movies'] },
                    { id: 'dummy2', name: 'Sam Chen', location: 'Hazel McCallion Academic Learning Centre', time: '12m ago', interests: ['Art', 'Design', 'Music', 'Hiking'] },
                    { id: 'dummy3', name: 'Jordan Smith', location: 'Deerfield Hall', time: 'Now', interests: ['Coding', 'Coffee', 'Startups'] }
                ];
                dummyUsers.forEach(user => userListEl.appendChild(createUserCard(user, null, {})));
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            userListEl.innerHTML = '<div class="loading-users">Could not load users.</div>';
        }
    }

    async function renderMyFriends() {
        const listEl = document.getElementById('myFriendsList');
        if (!listEl) return;
        listEl.innerHTML = '<div class="loading-users">Loading your friends...</div>';

        try {
            const myUid = auth.currentUser.uid;
            const snap = await db.collection('users').doc(myUid).collection('friends')
                .where('status', '==', 'accepted').get();

            listEl.innerHTML = '';

            if (snap.empty) {
                listEl.innerHTML = '<div class="loading-users" style="color:var(--text-secondary)">No friends yet — discover people nearby!</div>';
                return;
            }

            for (const friendDoc of snap.docs) {
                const friendUid = friendDoc.id;
                const uDoc = await db.collection('users').doc(friendUid).get();
                if (!uDoc.exists) continue;
                const ud = uDoc.data();
                const card = createUserCard({
                    id: friendUid,
                    name: ud.name || ud.email.split('@')[0],
                    avatar: ud.avatar || '',
                    location: ud.location || 'UTM Campus',
                    time: 'Friend',
                    interests: ud.tags && ud.tags.length > 0
                        ? ud.tags.map(t => typeof t === 'object' ? t.text : t)
                        : ['UTM Student']
                }, 'accepted', {});
                listEl.appendChild(card);
            }
        } catch (e) {
            console.error("Error loading friends:", e);
            listEl.innerHTML = '<div class="loading-users">Could not load friends.</div>';
        }
    }

    async function renderIncomingRequests() {
        const banner = document.getElementById('incomingRequestsBanner');
        const list = document.getElementById('incomingRequestsList');
        if (!banner || !list) return;

        try {
            const myUid = auth.currentUser.uid;
            // Fetch all pending, filter client-side (avoids composite index requirement)
            const snap = await db.collection('users').doc(myUid).collection('friends')
                .where('status', '==', 'pending')
                .get();
            // Only show requests where someone ELSE initiated (i.e. incoming)
            const incoming = snap.docs.filter(d => d.data().initiator !== myUid);

            if (incoming.length === 0) {
                banner.style.display = 'none';
                return;
            }

            banner.style.display = '';
            list.innerHTML = '';

            for (const reqDoc of incoming) {
                const fromUid = reqDoc.id;
                const uDoc = await db.collection('users').doc(fromUid).get();
                const name = uDoc.exists ? (uDoc.data().name || fromUid) : fromUid;

                const item = document.createElement('div');
                item.className = 'request-item';
                item.innerHTML = `
                    <span class="request-name">${name} wants to connect</span>
                    <div class="request-actions">
                        <button class="btn-accept" data-uid="${fromUid}">Accept</button>
                        <button class="btn-decline" data-uid="${fromUid}">Decline</button>
                    </div>
                `;
                item.querySelector('.btn-accept').addEventListener('click', async () => {
                    await acceptFriendRequest(fromUid);
                    await renderIncomingRequests();
                    await renderMyFriends();
                    await renderDiscover();
                });
                item.querySelector('.btn-decline').addEventListener('click', async () => {
                    await removeFriend(fromUid);
                    await renderIncomingRequests();
                    await renderDiscover();
                });
                list.appendChild(item);
            }
        } catch (e) {
            console.error("Error loading incoming requests:", e);
        }
    }

    function createUserCard(user, friendStatus, allStatuses) {
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

        // Actions area
        const actions = document.createElement('div');
        actions.className = 'card-actions-v2';

        // Build the right button based on status
        if (friendStatus === 'accepted') {
            actions.innerHTML = `<button class="btn-card-friends" onclick="event.stopPropagation();">✓ Friends</button>
                <div class="btn-card-remove" title="Remove friend" onclick="event.stopPropagation();">−</div>`;
            actions.querySelector('.btn-card-remove').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Remove ${user.name} as a friend?`)) {
                    await removeFriend(user.id);
                    await renderMyFriends();
                    await renderDiscover();
                }
            });
        } else if (friendStatus === 'pending_outgoing') {
            actions.innerHTML = `<button class="btn-card-pending" onclick="event.stopPropagation();" disabled>Pending ✓</button>`;
        } else if (friendStatus === 'pending_incoming') {
            actions.innerHTML = `<button class="btn-card-accept" onclick="event.stopPropagation();">Accept</button>`;
            actions.querySelector('.btn-card-accept').addEventListener('click', async (e) => {
                e.stopPropagation();
                await acceptFriendRequest(user.id);
                await renderIncomingRequests();
                await renderMyFriends();
                await renderDiscover();
            });
        } else {
            // Not friends — show Add button
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-card-add';
            addBtn.textContent = 'Add +';
            addBtn.onclick = async (e) => {
                e.stopPropagation();
                addBtn.disabled = true;
                addBtn.textContent = 'Sending...';
                try {
                    await sendFriendRequest(user.id);
                    addBtn.textContent = 'Pending ✓';
                    addBtn.className = 'btn-card-pending';
                } catch (err) {
                    console.error(err);
                    addBtn.disabled = false;
                    addBtn.textContent = 'Add +';
                }
            };
            actions.appendChild(addBtn);
        }

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container-v2';

        const tagColors = ['orange', 'blue', 'purple', 'teal', 'magenta', 'dark-blue'];
        const interests = user.interests || ['General'];

        interests.forEach((interest, index) => {
            const tag = document.createElement('span');
            tag.className = `tag-v2 tag-${tagColors[index % tagColors.length]}`;
            tag.textContent = interest;
            tagsContainer.appendChild(tag);
        });

        card.appendChild(header);
        card.appendChild(actions);
        card.appendChild(tagsContainer);

        return card;
    }

    // ─── PROFILE PAGE ───────────────────────────────────────────────────────────

    async function initProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        const uid = urlParams.get('uid') || (auth.currentUser ? auth.currentUser.uid : null);

        if (!uid) return;

        const backNav = document.getElementById('backToFriends');
        if (backNav) backNav.onclick = () => window.history.back();

        // Show/hide edit button: only for own profile
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            if (auth.currentUser && uid === auth.currentUser.uid) {
                editBtn.style.display = '';
            } else {
                editBtn.style.display = 'none';
            }
        }

        try {
            const doc = await db.collection('users').doc(uid).get();

            let userData;
            if (doc.exists) {
                userData = doc.data();
            } else {
                userData = {
                    name: 'No profile found',
                    bio: '',
                    avatar: '',
                    tags: []
                };
            }

            const nameEl = document.getElementById('userNameDisplay');
            if (nameEl) nameEl.textContent = userData.name || 'User';

            const avatarEl = document.getElementById('userAvatar');
            if (avatarEl) {
                avatarEl.src = userData.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0Ij48L2NpcmNsZT48cGF0aCBkPSJNMjAgMjF2LTIgYTQgNCAwIDAgMC00LTRoLTggYTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjwvc3ZnPg==';
            }

            const bioEl = document.getElementById('userBioDisplay');
            if (bioEl) bioEl.textContent = userData.bio || 'No bio yet.';

            const tags = userData.tags && userData.tags.length > 0 ? userData.tags : [];
            renderCategorizedTags(tags);

        } catch (error) {
            console.error("Error loading profile:", error);
        }

        setupUploader();
    }

    // ─── EDIT PROFILE ───────────────────────────────────────────────────────────

    async function initEditProfile() {
        const backBtn = document.getElementById("backToProfile");
        if (backBtn) backBtn.onclick = () => window.location.href = "profile.html";

        if (!auth.currentUser) return;

        let currentTags = [];

        try {
            const doc = await db.collection("users").doc(auth.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                if (document.getElementById("editName")) document.getElementById("editName").value = data.name || "";
                if (document.getElementById("editBio")) document.getElementById("editBio").value = data.bio || "";
                if (document.getElementById("editProgram")) document.getElementById("editProgram").value = data.program || "None";
                if (document.getElementById("editAvatar") && data.avatar) document.getElementById("editAvatar").src = data.avatar;
                currentTags = (data.tags || []).map(t => typeof t === 'object' ? t.text : t);
            }
        } catch (e) {
            console.error("Failed to load profile for editing:", e);
        }

        // Render tag selector
        renderTagSelector(currentTags);

        // Save handler
        const saveBtn = document.getElementById("saveProfileBtn");
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const name = document.getElementById("editName")?.value ?? "";
                const bio = document.getElementById("editBio")?.value ?? "";
                const program = document.getElementById("editProgram")?.value ?? "None";

                // Collect selected tags
                const selectedTags = Array.from(document.querySelectorAll('.tag-chip.selected'))
                    .map(el => el.dataset.tag);

                try {
                    await db.collection("users").doc(auth.currentUser.uid).update({
                        name,
                        bio,
                        program,
                        tags: selectedTags
                    });

                    const toast = document.getElementById("saveToast");
                    if (toast) {
                        toast.style.display = "block";
                        toast.textContent = "Changes saved ✓";
                        setTimeout(() => toast.style.display = "none", 2500);
                    }
                } catch (e) {
                    console.error("Failed to save profile changes:", e);
                }
            };
        }
    }

    function renderTagSelector(selectedTags) {
        const container = document.getElementById('tagSelectorContainer');
        if (!container) return;

        container.innerHTML = '';

        const sections = [
            { label: 'Interests', key: 'interests' },
            { label: 'Education / Skills', key: 'skills' },
            { label: 'Hangout Spots', key: 'hangout' }
        ];

        sections.forEach(({ label, key }) => {
            const heading = document.createElement('p');
            heading.className = 'tag-section-label';
            heading.textContent = label;
            container.appendChild(heading);

            const row = document.createElement('div');
            row.className = 'tag-chip-row';

            ALL_TAGS[key].forEach(tag => {
                const chip = document.createElement('span');
                chip.className = 'tag-chip' + (selectedTags.includes(tag) ? ' selected' : '');
                chip.dataset.tag = tag;
                chip.textContent = tag;
                chip.addEventListener('click', () => chip.classList.toggle('selected'));
                row.appendChild(chip);
            });

            container.appendChild(row);
        });
    }

    function renderCategorizedTags(tags) {
        const interestsContainer = document.getElementById('interestsTags');
        const skillsContainer = document.getElementById('skillsTags');
        const hangoutContainer = document.getElementById('hangoutTags');

        if (!interestsContainer) return;

        interestsContainer.innerHTML = '';
        if (skillsContainer) skillsContainer.innerHTML = '';
        if (hangoutContainer) hangoutContainer.innerHTML = '';

        tags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            const text = typeof tag === 'object' ? tag.text : tag;
            pill.textContent = text;
            const lower = text.toLowerCase();

            if (ALL_TAGS.hangout.map(t => t.toLowerCase()).includes(lower)) {
                pill.classList.add('purple');
                if (hangoutContainer) hangoutContainer.appendChild(pill);
            } else if (ALL_TAGS.skills.map(t => t.toLowerCase()).includes(lower)) {
                pill.classList.add('blue');
                if (skillsContainer) skillsContainer.appendChild(pill);
            } else {
                pill.classList.add('orange');
                interestsContainer.appendChild(pill);
            }
        });

        // Show placeholder if empty
        if (interestsContainer.children.length === 0) interestsContainer.innerHTML = '<span style="color:var(--text-secondary);font-size:14px">None set</span>';
        if (skillsContainer && skillsContainer.children.length === 0) skillsContainer.innerHTML = '<span style="color:var(--text-secondary);font-size:14px">None set</span>';
        if (hangoutContainer && hangoutContainer.children.length === 0) hangoutContainer.innerHTML = '<span style="color:var(--text-secondary);font-size:14px">None set</span>';
    }

    function setupUploader() {
        const overlay = document.querySelector('.avatar-edit-overlay');
        const placeholder = document.querySelector('.uploader-placeholder');
        const message = () => alert('The uploader is almost ready! We are finishing the Firebase Storage connection.');
        if (overlay) overlay.addEventListener('click', message);
        if (placeholder) placeholder.addEventListener('click', message);
    }

    async function uploadProfileImage(file) {
        if (!auth.currentUser) return;
        const storageRef = storage.ref(`avatars/${auth.currentUser.uid}`);
        try {
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            await db.collection('users').doc(auth.currentUser.uid).update({ avatar: downloadURL });
            return downloadURL;
        } catch (error) {
            console.error("Upload failed:", error);
            throw error;
        }
    }

    function initLocation(mockLocation) {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => updateLocationUI(mockLocation.name, mockLocation.shortName),
                () => updateLocationUI(mockLocation.name, mockLocation.shortName)
            );
        } else {
            updateLocationUI(mockLocation.name, mockLocation.shortName);
        }
    }

    function updateLocationUI(fullName, shortName) {
        if (document.getElementById('locationName')) document.getElementById('locationName').textContent = fullName;
        if (document.getElementById('locationNameShort')) document.getElementById('locationNameShort').textContent = shortName;
    }
});
