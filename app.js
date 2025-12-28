// CONFIG – replace with your real values
const APP_URL = "https://script.google.com/macros/s/AKfycbwAFWjCO-YO7G05yww1Z0lrxYfYZk2qxY8YG00f2hmIuZzr-bC-QnRRiFMHrHhbj-Ey/exec";

const firebaseConfig = {

  apiKey: "AIzaSyC-N8mkMcWX-gIS5KOtsPjeFGo5kA67who",

  authDomain: "couplechat-3bb57.firebaseapp.com",

  projectId: "couplechat-3bb57",

  storageBucket: "couplechat-3bb57.firebasestorage.app",

  messagingSenderId: "937917097298",

  appId: "1:937917097298:web:9215f495fd0a35a644c68b",

  measurementId: "G-SC6X7Q1BD9"

};

const VAPID_KEY = "BFmkzxW2WUp6NTNl-Q7CK8_1_tyHU4yXZa2e1F1rR9TkqjBq8qf6dhDbpATrIgaxIV9ZEg2I4BSa2v2H8kAnGRs";


firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

let userId = localStorage.userId || null;
let partnerId = localStorage.partnerId || null;

function show(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active')}
function uuid(){return crypto.randomUUID()}

async function registerFCM(){
  const perm=await Notification.requestPermission();
  if(perm!=='granted')return;
  const token=await messaging.getToken({vapidKey:VAPID_KEY});
  await fetch(API_URL,{method:'POST',body:JSON.stringify({action:'registerToken',user:userId,token})});
}

const App={
  start(){
    if(!userId){userId=uuid();localStorage.userId=userId}
    registerFCM();this.route()
  },
  route(){
    const invite=new URLSearchParams(location.search).get('invite');
    if(invite){window._invite=invite;show('confirm')}
    else if(partnerId){show('chat');this.poll();setInterval(()=>this.poll(),3000)}
    else show('home')
  },
  createInvite(){
    inviteLink.innerText=location.origin+location.pathname+'?invite='+userId
  },
 async confirmPair(){
  console.log("Confirm clicked", userId, window._invite);

  if (!APP_URL) {
    alert("API_URL missing");
    return;
  }

  try {
    const res = await fetch(APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "pairUsers",
        userId,
        partnerId: window._invite
      })
    });

    if (!res.ok) throw new Error("Backend error");

    partnerId = window._invite;
    localStorage.partnerId = partnerId;
    this.route();

  } catch (e) {
    console.error("Pairing failed", e);
    alert("Pairing failed. Check console.");
  }
},
  async send(){
    if(!text.value)return;
    await fetch(APP_URL,{method:'POST',body:JSON.stringify({action:'sendMessage',from:userId,to:partnerId,cipher:{text:text.value}})});
    text.value=''
  },
  async poll(){
    const r=await fetch(APP_URL+'?action=getMessages&user='+userId);
    const d=await r.json();messages.innerHTML='';
    d.forEach(m=>{const div=document.createElement('div');div.className='msg '+(m[1]===userId?'me':'them');div.textContent=m[3].text;messages.appendChild(div)});
    messages.scrollTop=messages.scrollHeight
  },
  reset(){localStorage.clear();location.reload()}
};

App.start();
