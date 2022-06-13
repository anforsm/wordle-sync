import * as firebaseui from "firebaseui"
import firebase from "firebase/compat/app"
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth"
import "firebaseui/dist/firebaseui.css"
import React from "react";
import ReactDOM from "react-dom";
import { Button, Link, TextField } from "@mui/material";

const firebaseConfig = {
  apiKey: "AIzaSyD3PTEQsuWSVRY0B80rXv5iEGMTk1ygOD0",
  authDomain: "wordle-sync-d2a0d.firebaseapp.com",
  projectId: "wordle-sync-d2a0d",
  storageBucket: "wordle-sync-d2a0d.appspot.com",
  messagingSenderId: "728126301908",
  appId: "1:728126301908:web:a916287eefef650a503d41"
};

const app = initializeApp(firebaseConfig);


const bgPage = chrome.extension.getBackgroundPage();

const App = (props) => {
  const [counter, setCounter] = React.useState(0);
  const [inOrUp, setInOrUp] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [signedIn, setSignedIn] = React.useState(false);
  const [error, setError] = React.useState("")
  const [signedInEmail, setSignedInEmail] = React.useState("");
  const [signedInUID, setSignedInUID] = React.useState("");

  React.useEffect(() => {
    chrome.runtime.sendMessage({action: "sign-in-status"}, (response) => {
      setSignedIn(response.payload.signedIn);
      if (response.payload.signedIn) {
        setSignedInEmail(response.payload.email);
        setSignedInUID(response.payload.uid);
      }
    })
  }, [])

  const signIn = () => {
    chrome.runtime.sendMessage({action: inOrUp ? "sign-in" : "sign-up", payload: {email: email, password: password}}, response => {
      if (response.status === "success") {
        setSignedIn(true);
      } else {
        console.log(response.payload.error)
        setError(response.payload.error);
      }
    });
  }

  const signOut = () => {
    chrome.runtime.sendMessage({action: "sign-out"}, response => {
      if (response.status === "success") {
        setSignedIn(false);
      } else {
        console.log(response.payload.error)
      }
    });
  }

  return <div id="content" className="flex-center">
      <h1 class="title">Wordle Sync</h1>
      {!signedIn && <>
        <TextField id="email" label="Email" value={email} onChange={e => setEmail(e.target.value)}variant="standard"/>
        <TextField id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} variant="standard"/>
        <Button variant="outlined" sx={{width: 0.5}} onClick={() => signIn()}>Sign {inOrUp ? "In" : "Up"}</Button>
        {inOrUp && <span>Don't have an account? <Link component="button" onClick={() => setInOrUp(false)}>Sign Up</Link></span>}
        {!inOrUp && <span>Have an account? <Link component="button" onClick={() => setInOrUp(true)}>Sign In</Link></span>}
        {error && <span>{error.code}</span>}
      </>}
      {signedIn && <>
        <Button variant="outlined" onClick={() => signOut()}>Sign Out</Button>
        <span>Signed in as {signedInEmail}</span>
        <span>{signedInUID}</span>
      </>}
    </div>
}

ReactDOM.render(
  <App/>,
  document.getElementById("root")
)


/*
document.addEventListener("DOMContentLoaded", () => {
  const SignInButton = document.getElementById("sign-in-button")
  const SignOutButton = document.getElementById("sign-out-button")

  let uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: (authResult, redirectUrl) => {
        console.log("signed in successfully");
        document.getElementById("sign").appendChild(SignOutButton);
      },
      uiShown: () => {
        console.log("ui shown");
      }
    },
    signInOptions: [
      {
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        requireDisplayName: false,
      }
    ]
  }

  const ui = new firebaseui.auth.AuthUI(getAuth());


  chrome.runtime.sendMessage({"action": "sign-in-status"}, response => {
    if (response.status === "success" && response.payload.signedIn) {

    } else {
      SignOutButton.remove();
      ui.start("#firebaseui-auth-container", uiConfig);
    }

  })


  SignOutButton.addEventListener("click", () => {
    console.log("sign out")
    chrome.runtime.sendMessage({"action": "sign-out"}, response => {
      if (response.status === "success") {
        SignOutButton.remove()
        console.log("updated dom??")
        ui.start("#firebaseui-auth-container", uiConfig);
        //document.getElementById("sign").appendChild(SignInButton);
      }
    })
  })


  const undoButton = document.getElementById("undo")

  undoButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({"action": "undo"}, response => {

    })
  })



})
*/