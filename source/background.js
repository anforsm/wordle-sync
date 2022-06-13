import { initializeApp } from "firebase/app";
import { signInWithCredential, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, auth, getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, update, ref, get, child, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD3PTEQsuWSVRY0B80rXv5iEGMTk1ygOD0",
  authDomain: "wordle-sync-d2a0d.firebaseapp.com",
  projectId: "wordle-sync-d2a0d",
  storageBucket: "wordle-sync-d2a0d.appspot.com",
  messagingSenderId: "728126301908",
  appId: "1:728126301908:web:a916287eefef650a503d41"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app, "https://wordle-sync-d2a0d-default-rtdb.europe-west1.firebasedatabase.app");

const sendToContentScripts = (message) => {
  chrome.tabs.query({url: "https://www.nytimes.com/games/wordle/index.html"}, (tabs) => {
    console.log(tabs)
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
}



let currentUid = null
onAuthStateChanged(getAuth(), (user) => {
  console.log(user)
  if (user) {
    currentUid = user.uid

    console.log("users/" + currentUid)
    const userRef = ref(database, "users/" + currentUid + "/wordle_data")
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
      }
    })

    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        sendToContentScripts({"action": "db-updated", "payload": snapshot.val()})
      }
    })
  } else {
    currentUid = null;
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  if (message.action) {
    if (message.action === "database-update") {
      if (getAuth().currentUser) {
        update(ref(database, "users/" + currentUid + "/wordle_data"), message.payload);
      } else {
      }
    }
    if (message.action === "get-database") {

      if (getAuth().currentUser) {
        get(ref(database, "users/" + currentUid + "/wordle_data")).then((resp) => {
          console.log(resp.val())
          sendResponse({"status": "success", "payload": resp.val() ? resp.val() : {}})
        })
      } else {
        sendResponse({"status": "success", "payload": {}})
      }
      return true
    }

    if (message.action === "reload") {
      console.log("reloading")
      console.log(sender)
      chrome.tabs.reload(sender.tab.id)
    }
    if (message.action === "sign-in") {
      console.log(message.payload)
      signInWithEmailAndPassword(getAuth(), message.payload.email, message.payload.password)
        .then(() => {
          sendResponse({ "status": "success", "payload": {"signedIn": true}});
        }
        )
        .catch(error => {
          sendResponse({ "status": "error", "payload": {"signedIn": false, "error": error}});
        }
        )
      return true
    }

    if (message.action === "sign-up") {
      console.log(message.payload)
      createUserWithEmailAndPassword(getAuth(), message.payload.email, message.payload.password)
        .then(() => {
          sendResponse({ "status": "success", "payload": {"signedIn": true}});
        }
        )
        .catch(error => {
          sendResponse({ "status": "error", "payload": {"signedIn": false, "error": error}});
        }
        )
      return true
    }


    if (message.action === "sign-out") {
      signOut(getAuth()).then(() => sendResponse({ "status": "success" }))
      return true
    }

    if (message.action === "sign-in-status") {
      if (getAuth().currentUser) {
        sendResponse({ "status": "success", "payload": { 
          "signedIn": true ,
          "email": getAuth().currentUser.email,
          "uid": getAuth().currentUser.uid
        } })
      } else {
        sendResponse({ "status": "success", "payload": { "signedIn": false } })
      }
      return true
    }

    
  }
})
