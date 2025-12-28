/************************************************************
 * CONFIG – FILL THESE VALUES ONCE
 ************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbwAFWjCO-YO7G05yww1Z0lrxYfYZk2qxY8YG00f2hmIuZzr-bC-QnRRiFMHrHhbj-Ey/exec";

const firebaseConfig = {

  apiKey: "AIzaSyC-N8mkMcWX-gIS5KOtsPjeFGo5kA67who",

  authDomain: "couplechat-3bb57.firebaseapp.com",

  projectId: "couplechat-3bb57",

  messagingSenderId: "937917097298",

  appId: "1:937917097298:web:9215f495fd0a35a644c68b"

};

const VAPID_KEY = "BFmkzxW2WUp6NTNl-Q7CK8_1_tyHU4yXZa2e1F1rR9TkqjBq8qf6dhDbpATrIgaxIV9ZEg2I4BSa2v2H8kAnGRs";


/************************************************************
 * INIT FIREBASE (NON-BLOCKING)
 ************************************************************/
let messaging = null;
try {
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();
} catch (e) {
  console.warn("Firebase init skipped:", e);
}

/************************************************************
 * GLOBAL STATE
 ************************************************************/
let userId = localStorage.getItem("userId");
let partnerId = localStorage.getItem("partnerId");

/************************************************************
 * HELPERS
 ************************************************************/
function uuid() {
  return crypto.randomUUID();
}

function show(pageId) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active")
  );
  document.getElementById(pageId).classList.add("active");
}

/************************************************************
 * FCM REGISTRATION (SAFE, OPTIONAL)
 ************************************************************/
async function registerFCM() {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await messaging.getToken({ vapidKey: VAPID_KEY });

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "registerToken",
        user: userId,
        token
      })
    });

    console.log("FCM token registered");
  } catch (e) {
    console.warn("FCM registration failed (ignored):", e);
  }
}

/************************************************************
 * MAIN APP OBJECT
 ************************************************************/
const App = {
  start() {
    if (!userId) {
      userId = uuid();
      localStorage.setItem("userId", userId);
    }

    // Register FCM but DO NOT block app flow
    registerFCM();

    this.route();
  },

  route() {
    const invite = new URLSearchParams(window.location.search).get("invite");

    if (invite) {
      window._invitePartner = invite;
      show("confirm");
      return;
    }

    if (partnerId) {
      show("chat");
      this.pollMessages();
      setInterval(this.pollMessages.bind(this), 3000);
      return;
    }

    show("home");
  },

  createInvite() {
    const link =
      window.location.origin +
      "/?invite=" +
      userId;

    document.getElementById("inviteLink").innerText = link;
  },

  async confirmPair() {
    if (!window._invitePartner) {
      alert("Invalid invite");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "pairUsers",
          userId: userId,
          partnerId: window._invitePartner
        })
      });

      if (!res.ok) throw new Error("Pairing failed");

      partnerId = window._invitePartner;
      localStorage.setItem("partnerId", partnerId);

      // Clean URL
      window.history.replaceState({}, "", "/");

      this.route();
    } catch (e) {
      console.error("Confirm pairing error:", e);
      alert("Pairing failed. Check console.");
    }
  },

  async send() {
    const input = document.getElementById("text");
    const message = input.value.trim();
    if (!message) return;

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "sendMessage",
          from: userId,
          to: partnerId,
          cipher: { text: message }
        })
      });

      input.value = "";
    } catch (e) {
      console.error("Send message failed:", e);
    }
  },

  async pollMessages() {
    try {
      const res = await fetch(
        API_URL + "?action=getMessages&user=" + userId
      );
      const data = await res.json();

      const box = document.getElementById("messages");
      box.innerHTML = "";

      data.forEach(row => {
        const div = document.createElement("div");
        div.className =
          "msg " + (row[1] === userId ? "me" : "them");
        div.textContent = row[3]?.text || "";
        box.appendChild(div);
      });

      box.scrollTop = box.scrollHeight;
    } catch (e) {
      console.warn("Polling failed:", e);
    }
  },

  reset() {
    localStorage.clear();
    window.location.reload();
  }
};

/************************************************************
 * BOOT
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  App.start();
});
