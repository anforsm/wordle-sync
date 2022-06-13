import { deepEqual } from "fast-equals";

const localStorageToRTDB = {
  "nyt-wordle-state": "currentState",
  "nyt-wordle-statistics": "stats",
  "nyt-wordle-darkmode": "darkMode",
  "nyt-wordle-cbmode": "cbMode"
}

let RTDBToLocalStorage = {
}

Object.keys(localStorageToRTDB).forEach(key => {
  RTDBToLocalStorage[localStorageToRTDB[key]] = key
});

const getCurrentLocalStorage = () => {
  let currentLocalStorage = {}
  Object.keys(localStorageToRTDB).forEach(key => {
    if (localStorage.getItem(key)) {
      currentLocalStorage[localStorageToRTDB[key]] = localStorage.getItem(key)
    }

  })
  return currentLocalStorage
}

chrome.runtime.sendMessage({"action": "get-database"}, response => {
  console.log(response)
  let anyChange = false;

  // check if the current state is newer than the remote state
  let localCurrentState = localStorage.getItem(RTDBToLocalStorage["currentState"])
  if (localCurrentState)
    localCurrentState = JSON.parse(localCurrentState)
  let remoteCurrentState = response.payload["currentState"]
  if (remoteCurrentState)
    remoteCurrentState = JSON.parse(remoteCurrentState)

  let remoteNewer = localCurrentState && remoteCurrentState
    && localCurrentState.solution === remoteCurrentState.solution
    && localCurrentState.rowIndex < remoteCurrentState.rowIndex

  if (remoteNewer) { 
    // set the local storage to the remote
    localStorage.setItem(RTDBToLocalStorage["currentState"], JSON.stringify(remoteCurrentState));
    anyChange = true;
    console.log("remote newer")
  } else if (localCurrentState) {
    // set the remote to the local
    chrome.runtime.sendMessage({"action": "database-update", "payload": {"currentState": JSON.stringify(localCurrentState)}});
  }

  // check if the stats are newer than the remote stats
  let localStats = localStorage.getItem(RTDBToLocalStorage["stats"])
  if (localStats)
    localStats = JSON.parse(localStats)
  let remoteStats = response.payload["stats"]
  if (remoteStats)
    remoteStats = JSON.parse(remoteStats)

  let remoteStatsNewer = remoteStats
    && (localStats?.gamesPlayed ? localStats.gamesPlayed : 0) < remoteStats.gamesPlayed

  if (remoteStatsNewer) {
    // set the local storage to the remote
    localStorage.setItem(RTDBToLocalStorage["stats"], JSON.stringify(remoteStats));
    console.log("remote stats newer")
    anyChange = true;
  } else if (localStats) {
    console.log("set remote stats")
    chrome.runtime.sendMessage({"action": "database-update", "payload": {"stats": JSON.stringify(localStats)}});
  }

  // check if the dark mode is newer than the remote dark mode
  let localDarkMode = localStorage.getItem(RTDBToLocalStorage["darkMode"])
  if (localDarkMode) 
    localDarkMode = JSON.parse(localDarkMode)
  let remoteDarkMode = response.payload["darkMode"]
  if (remoteDarkMode)
    remoteDarkMode = JSON.parse(remoteDarkMode)

  let remoteDarkModeNewer = remoteDarkMode !== null && remoteDarkMode !== undefined
    && localDarkMode !== remoteDarkMode
  
  console.log(remoteDarkModeNewer)
  console.log(localDarkMode)
  console.log(remoteDarkMode)

  if (remoteDarkModeNewer) {
    // set the local storage to the remote
    localStorage.setItem(RTDBToLocalStorage["darkMode"], JSON.stringify(remoteDarkMode));
    anyChange = true;
    console.log("remote dark mode newer")
  } else if (localDarkMode != null) {
    console.log("set remote dark mode")
    chrome.runtime.sendMessage({"action": "database-update", "payload": {"darkMode": JSON.stringify(localDarkMode)}});
  }

  // check if the colorblind mode is newer than the remote colorblind mode
  let localCbMode = localStorage.getItem(RTDBToLocalStorage["cbMode"])
  if (localCbMode)
    localCbMode = JSON.parse(localCbMode)
  let remoteCbMode = response.payload["cbMode"]
  if (remoteCbMode)
    remoteCbMode = JSON.parse(remoteCbMode)

  let remoteCbModeNewer = remoteCbMode !== null && remoteCbMode !== undefined
    && localCbMode !== remoteCbMode

  if (remoteCbModeNewer) {
    // set the local storage to the remote
    localStorage.setItem(RTDBToLocalStorage["cbMode"], JSON.stringify(remoteCbMode));
    anyChange = true;
    console.log("remote colorblind mode newer")
  } else if (localCbMode != null) {
    console.log("set remote colorblind mode")
    chrome.runtime.sendMessage({"action": "database-update", "payload": {"cbMode": JSON.stringify(localCbMode)}});
  }

  if (anyChange)
    chrome.runtime.sendMessage({"action": "reload"});
})


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "db-updated") {
    if (!deepEqual(getCurrentLocalStorage(), request.payload)) {
      chrome.runtime.sendMessage({"action": "reload"});
    }
  }
})


window.addEventListener("wordle-sync-local-storage-changed", ({detail: {change, key, value}}) => {
  console.log("local storage changed")
  if (change === "set") {
    if (Object.keys(localStorageToRTDB).includes(key)) {
      let updatedVal = {}
      updatedVal[localStorageToRTDB[key]] = value
      chrome.runtime.sendMessage({"action": "database-update", "payload": updatedVal})
    }
  }
})

//const modal = document.body.children[4].shadowRoot.children[1].children[1].children[3]
//document.body.children[4].shadowRoot.querySelector("game-modal").children[0].remove()
//document.body.children[4].shadowRoot.querySelector("game-modal").removeAttribute("open")
//window.addEventListener("DOMContentLoaded", () => {
//  console.log("dom loaded")
//  console.log("removed stats modal")
//})

const injectedScript = document.createElement("script");
injectedScript.src = chrome.runtime.getURL("wordleLocalStorageInjection.js");
document.head.appendChild(injectedScript)