// This file contains sensitive API keys and should NOT be uploaded to GitHub.
// It is included in .gitignore to prevent accidental commits.

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
