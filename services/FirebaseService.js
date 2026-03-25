import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { User } from '../models/User.js';

class FirebaseService {
    constructor() {
        // Your real Firebase Config
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

    // ─── AUTHENTICATION METHODS ──────────────────────────────────────────

    initAuth(callback) {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            if (user) {
                await this.loadMyProfile();
            }
            callback(user);
        });
    }

    async login(email, password) {
        return await signInWithEmailAndPassword(this.auth, email, password);
    }

    async signup(email, password, name) {
        const userCred = await createUserWithEmailAndPassword(this.auth, email, password);
        this.currentUser = userCred.user;
        
        // Create their initial profile in Firestore
        this.userModel = new User({ uid: this.currentUser.uid, name: name });
        const docRef = doc(this.getUsersCollection(), this.currentUser.uid);
        await setDoc(docRef, this.userModel.toFirestore());
        
        return userCred;
    }

    // ─── DATABASE METHODS ────────────────────────────────────────────────

    getUsersCollection() {
        return collection(this.db, 'users');
    }

    async loadMyProfile() {
        if (!this.currentUser) return;
        const docRef = doc(this.getUsersCollection(), this.currentUser.uid);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            this.userModel = new User({ uid: snap.id, ...snap.data() });
        } else {
            // Failsafe: if doc doesn't exist, create it
            this.userModel = new User({ uid: this.currentUser.uid, name: "New Student" });
            await setDoc(docRef, this.userModel.toFirestore());
        }
    }

    async saveMyProfile() {
        if (!this.currentUser) return;
        const docRef = doc(this.getUsersCollection(), this.currentUser.uid);
        await updateDoc(docRef, this.userModel.toFirestore());
    }

    // ─── STORAGE METHODS ────────────────────────────────────────────────
    
    async uploadAvatar(file, uid) {
        // Create a reference to 'avatars/USER_ID_TIMESTAMP'
        const storageRef = ref(this.storage, `avatars/${uid}_${Date.now()}`);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Return the public URL so we can save it to Firestore
        return await getDownloadURL(storageRef);
    }

    listenToAllUsers(callback) {
        if (!this.currentUser) return;
        return onSnapshot(this.getUsersCollection(), (snapshot) => {
            const allUsers = [];
            snapshot.forEach(docSnap => {
                if (docSnap.id !== this.currentUser.uid) { // Don't show the logged-in user to themselves
                    allUsers.push(new User({ uid: docSnap.id, ...docSnap.data() }));
                }
            });
            callback(allUsers);
        }, (error) => console.error("Snapshot error:", error));
    }

    // ─── FRIEND REQUEST SYSTEM ──────────────────────────────────────────

    listenToMyProfile(callback) {
        if (!this.currentUser) return;
        const docRef = doc(this.getUsersCollection(), this.currentUser.uid);
        // Real-time listener on your OWN profile to catch incoming requests instantly
        return onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                this.userModel = new User({ uid: snap.id, ...snap.data() });
                callback(this.userModel);
            }
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
        if (!this.userModel.friendsList.includes(targetUid)) this.userModel.friendsList.push(targetUid);
        await this.saveMyProfile();

        const targetRef = doc(this.getUsersCollection(), targetUid);
        const targetSnap = await getDoc(targetRef);
        if (targetSnap.exists()) {
            const targetData = targetSnap.data();
            const outgoing = (targetData.outgoingRequests || []).filter(id => id !== this.currentUser.uid);
            const friends = targetData.friendsList || [];
            if (!friends.includes(this.currentUser.uid)) friends.push(this.currentUser.uid);
            await updateDoc(targetRef, { outgoingRequests: outgoing, friendsList: friends });
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