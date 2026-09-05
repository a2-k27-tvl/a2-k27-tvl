// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update, push, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyD9kALAU9R8vB6x9UBcDEW1mHWagaFLzas",
    authDomain: "a2-k27-tvl.firebaseapp.com",
    projectId: "a2-k27-tvl",
    storageBucket: "a2-k27-tvl.firebasestorage.app",
    messagingSenderId: "992341533498",
    appId: "1:992341533498:web:44358a92094d0771e7e603",
    measurementId: "G-0DEST6Z2YE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { app, database, ref, set, get, child, update, push, query, orderByChild, equalTo };
