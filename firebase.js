/**
 * Firebase integratsiyasi (Auth + Firestore)
 * Modul sifatida yuklanadi va kerakli funksiyalarni window.FB orqali app.js ga beradi.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyClYvPS5jMpXk8iJDXsmekPm5hYHy6cYzA",
    authDomain: "mrbekmirzayev-ai.firebaseapp.com",
    projectId: "mrbekmirzayev-ai",
    storageBucket: "mrbekmirzayev-ai.firebasestorage.app",
    messagingSenderId: "51799795131",
    appId: "1:51799795131:web:8fd64f62a55e3b13ae509e",
    measurementId: "G-427YYRZVDK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sessiyani brauzerda saqlash
try {
    setPersistence(auth, browserLocalPersistence);
} catch (e) {
    console.warn("Auth persistence sozlanmadi:", e);
}

// Analytics ixtiyoriy — bloklangan bo'lsa ilova ishlashda davom etadi
(async () => {
    try {
        if (await isSupported()) getAnalytics(app);
    } catch (e) {
        console.warn("Analytics ishga tushmadi:", e);
    }
})();

/**
 * Like / dislike ma'lumotlarini Firestore'ga yozish.
 * collection: message_feedback
 */
async function saveFeedback(payload) {
    const { createdAtClient, ...rest } = payload || {};
    return addDoc(collection(db, "message_feedback"), {
        ...rest,
        createdAtClient: createdAtClient || new Date().toISOString(),
        createdAt: serverTimestamp()
    });
}

/**
 * Foydalanuvchi profilini Firestore'ga yozish/yangilash.
 * collection: users
 */
async function saveUserProfile(profile) {
    if (!profile || !profile.uid) return null;
    return setDoc(doc(db, "users", profile.uid), {
        ...profile,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

window.FB = {
    app,
    auth,
    db,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    saveFeedback,
    saveUserProfile
};

window.dispatchEvent(new Event("fb-ready"));
