/* Firebase Messaging Service Worker */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

/* 🔴 MUST MATCH YOUR firebaseConfig IN app.js */
firebase.initializeApp({
  apiKey: "AIzaSyC-N8mkMcWX-gIS5KOtsPjeFGo5kA67who",

  authDomain: "couplechat-3bb57.firebaseapp.com",

  projectId: "couplechat-3bb57",

  storageBucket: "couplechat-3bb57.firebasestorage.app",

  messagingSenderId: "937917097298",

  appId: "1:937917097298:web:9215f495fd0a35a644c68b"
});

const messaging = firebase.messaging();

/* Optional: handle background messages */
messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(
    payload.notification?.title || "New message",
    {
      body: payload.notification?.body || "You received a message",
      icon: "/favicon.ico"
    }
  );
});
