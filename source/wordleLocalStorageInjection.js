
let setItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  if (this === window.localStorage) {
    const event = new CustomEvent("wordle-sync-local-storage-changed", {detail: {
      "change": "set",
      "key": key,
      "value": value
    }});
    window.dispatchEvent(event)
  }
  setItem.apply(this, arguments);
}