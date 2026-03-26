import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    onSnapshot,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { User } from '../models/User.js';

class FirebaseService {
    constructor() {
        const firebaseConfig = {
            apiKey: "AIzaSyB4Og7LaXo_Ywu4PAiQqWT-cJGkoiE30Ms",
            authDomain: "findrfirebase-2266a.firebaseapp.com",
            projectId: "findrfirebase-2266a",
            storageBucket: "findrfirebase-2266a.firebasestorage.app",
            messagingSenderId: "324771059735",
            appId: "1:324771059735:web:844951a3f693a3ca6fe452",
            measurementId: "G-V1NM15JQ36"
        };

        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.currentUser = null;
        this.userModel = new User();
        this.storage = getStorage(this.app);
    }

    initAuth(callback) {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;

            try {
                if (user) {
                    await this.loadMyProfile();

                    // only keep this if you added the presence-based version
                    if (typeof this.ensureMyPresenceDoc === 'function') {
                        await this.ensureMyPresenceDoc();
                    }
                }

                callback(user);
            } catch (error) {
                console.error("initAuth failed:", error);

                // still call callback so the app does not hang forever
                callback(null);
            }
        });
    }

    async login(email, password) {
        return await signInWithEmailAndPassword(this.auth, email, password);
    }

    async signup(email, password, name) {
        const userCred = await createUserWithEmailAndPassword(this.auth, email, password);
        this.currentUser = userCred.user;

        this.userModel = new User({
            uid: this.currentUser.uid,
            name: name
        });

        await setDoc(doc(this.getUsersCollection(), this.currentUser.uid), this.userModel.toFirestore());

        await setDoc(doc(this.getPresenceCollection(), this.currentUser.uid), {
            locationName: this.userModel.lastLocation,
            locationCode: this.userModel.locationCode,
            locationTrackingEnabled: true,
            privateModeEnabled: false,
            updatedAt: serverTimestamp()
        });

        return userCred;
    }

    getUsersCollection() {
        return collection(this.db, 'users');
    }

    getPresenceCollection() {
        return collection(this.db, 'presence');
    }

    async loadMyProfile() {
        if (!this.currentUser) return;

        const docRef = doc(this.getUsersCollection(), this.currentUser.uid);

        try {
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                this.userModel = new User({ uid: snap.id, ...snap.data() });
            } else {
                this.userModel = new User({
                    uid: this.currentUser.uid,
                    name: "New Student"
                });

                await setDoc(docRef, this.userModel.toFirestore());
            }

            const presenceRef = doc(this.getPresenceCollection(), this.currentUser.uid);
            const presenceSnap = await getDoc(presenceRef);

            if (presenceSnap.exists()) {
                const p = presenceSnap.data();

                this.userModel.lastLocation = p.locationName || this.userModel.lastLocation;
                this.userModel.locationCode = p.locationCode || this.userModel.locationCode;
                this.userModel.locationTrackingEnabled =
                    typeof p.locationTrackingEnabled === 'boolean'
                        ? p.locationTrackingEnabled
                        : this.userModel.locationTrackingEnabled;
                this.userModel.privateModeEnabled =
                    typeof p.privateModeEnabled === 'boolean'
                        ? p.privateModeEnabled
                        : this.userModel.privateModeEnabled;
            }
        } catch (error) {
            console.error("loadMyProfile failed:", error);
            throw error;
        }
    }

    async ensureMyPresenceDoc() {
        if (!this.currentUser) return;

        try {
            const ref = doc(this.getPresenceCollection(), this.currentUser.uid);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                await setDoc(ref, {
                    locationName: this.userModel.lastLocation || 'Maanjiwe Nendamowinan',
                    locationCode: this.userModel.locationCode || 'MN',
                    locationTrackingEnabled: true,
                    privateModeEnabled: false,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error("ensureMyPresenceDoc failed:", error);
            throw error;
        }
    }

    async saveMyProfile() {
        if (!this.currentUser) return;
        await updateDoc(doc(this.getUsersCollection(), this.currentUser.uid), this.userModel.toFirestore());
    }

    async saveMyPresence() {
        if (!this.currentUser) return;

        await setDoc(
            doc(this.getPresenceCollection(), this.currentUser.uid),
            {
                locationName: this.userModel.lastLocation,
                locationCode: this.userModel.locationCode,
                locationTrackingEnabled: this.userModel.locationTrackingEnabled,
                privateModeEnabled: this.userModel.privateModeEnabled,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );
    }

    async saveMySettings(settings = {}) {
        if (!this.currentUser) return;

        Object.assign(this.userModel, settings);
        await this.saveMyPresence();
    }

    async updateMyLocation(locationName, locationCode = '') {
        if (!this.currentUser) return;

        this.userModel.lastLocation = locationName;
        this.userModel.locationCode = locationCode || locationName;

        if (this.userModel.locationTrackingEnabled) {
            await this.saveMyPresence();
        }
    }

    async uploadAvatar(file, uid) {
        const storageRef = ref(this.storage, `avatars/${uid}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }

    listenToMyProfile(callback) {
        if (!this.currentUser) return;

        return onSnapshot(doc(this.getUsersCollection(), this.currentUser.uid), async (snap) => {
            if (!snap.exists()) return;

            this.userModel = new User({ uid: snap.id, ...snap.data() });

            const presenceSnap = await getDoc(doc(this.getPresenceCollection(), this.currentUser.uid));
            if (presenceSnap.exists()) {
                const p = presenceSnap.data();
                this.userModel.lastLocation = p.locationName || this.userModel.lastLocation;
                this.userModel.locationCode = p.locationCode || this.userModel.locationCode;
                this.userModel.locationTrackingEnabled =
                    typeof p.locationTrackingEnabled === 'boolean' ? p.locationTrackingEnabled : true;
                this.userModel.privateModeEnabled =
                    typeof p.privateModeEnabled === 'boolean' ? p.privateModeEnabled : false;
            }

            callback(this.userModel);
        });
    }

    listenToVisibleUsersInMyLocation(callback) {
        if (!this.currentUser) return;

        return onSnapshot(this.getPresenceCollection(), async (presenceSnapshot) => {
            const visiblePresence = [];
            const myLocationCode = this.userModel.locationCode || this.userModel.lastLocation;

            presenceSnapshot.forEach((docSnap) => {
                if (docSnap.id === this.currentUser.uid) return;

                const p = docSnap.data();
                const otherLocationCode = p.locationCode || p.locationName;

                if (otherLocationCode === myLocationCode) {
                    visiblePresence.push({ uid: docSnap.id, ...p });
                }
            });

            const users = await Promise.all(
                visiblePresence.map(async (presence) => {
                    const userSnap = await getDoc(doc(this.getUsersCollection(), presence.uid));
                    if (!userSnap.exists()) return null;

                    return new User({
                        uid: presence.uid,
                        ...userSnap.data(),
                        lastLocation: presence.locationName,
                        locationCode: presence.locationCode,
                        locationTrackingEnabled: presence.locationTrackingEnabled,
                        privateModeEnabled: presence.privateModeEnabled
                    });
                })
            );

            callback(users.filter(Boolean));
        }, (error) => {
            console.error("Presence snapshot error:", error);
        });
    }

    async sendFriendRequest(targetUid) {
        if (!this.userModel.outgoingRequests.includes(targetUid)) {
            this.userModel.outgoingRequests.push(targetUid);
            await this.saveMyProfile();
        }

        const targetRef = doc(this.getUsersCollection(), targetUid);
        const targetSnap = await getDoc(targetRef);

        if (targetSnap.exists()) {
            const targetData = targetSnap.data();
            const incoming = targetData.incomingRequests || [];
            if (!incoming.includes(this.currentUser.uid)) {
                incoming.push(this.currentUser.uid);
                await updateDoc(targetRef, { incomingRequests: incoming });
            }
        }
    }

    async acceptFriendRequest(targetUid) {
        this.userModel.incomingRequests = this.userModel.incomingRequests.filter(id => id !== targetUid);
        if (!this.userModel.friendsList.includes(targetUid)) {
            this.userModel.friendsList.push(targetUid);
        }
        await this.saveMyProfile();

        const targetRef = doc(this.getUsersCollection(), targetUid);
        const targetSnap = await getDoc(targetRef);

        if (targetSnap.exists()) {
            const targetData = targetSnap.data();
            const outgoing = (targetData.outgoingRequests || []).filter(id => id !== this.currentUser.uid);
            const friends = targetData.friendsList || [];

            if (!friends.includes(this.currentUser.uid)) {
                friends.push(this.currentUser.uid);
            }

            await updateDoc(targetRef, {
                outgoingRequests: outgoing,
                friendsList: friends
            });
        }
    }

    async declineFriendRequest(targetUid) {
        this.userModel.incomingRequests = this.userModel.incomingRequests.filter(id => id !== targetUid);
        await this.saveMyProfile();

        const targetRef = doc(this.getUsersCollection(), targetUid);
        const targetSnap = await getDoc(targetRef);

        if (targetSnap.exists()) {
            const targetData = targetSnap.data();
            const outgoing = (targetData.outgoingRequests || []).filter(id => id !== this.currentUser.uid);
            await updateDoc(targetRef, { outgoingRequests: outgoing });
        }
    }
}

export const fb = new FirebaseService();