const toggleSwitch = document.getElementById('toggleSwitch');
const debugSwitch = document.getElementById('debugSwitch');

function safeStorageSet(data) {
    if (!chrome || !chrome.storage || !chrome.storage.local) return;
    try {
        chrome.storage.local.set(data);
    } catch (e) {
        console.error('chrome.storage.local.set failed:', e);
    }
}

function safeStorageGet(keys, callback) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
        callback({});
        return;
    }
    try {
        chrome.storage.local.get(keys, callback);
    } catch (e) {
        console.error('chrome.storage.local.get failed:', e);
        callback({});
    }
}

// Load the stored state and update the switch
safeStorageGet('extensionEnabled', function(data) {
    toggleSwitch.checked = data.extensionEnabled !== undefined ? data.extensionEnabled : true;
});
safeStorageGet('debugEnabled', function(data) {
    debugSwitch.checked = data.debugEnabled === true;
});

// Save the new state whenever the switch is toggled
toggleSwitch.addEventListener('change', function() {
    const newState = this.checked;
    safeStorageSet({ 'extensionEnabled': newState });
    chrome.runtime.sendMessage({
        action: 'toggleExtension',
        extensionEnabled: newState
    });
});

debugSwitch.addEventListener('change', function() {
    const debugState = this.checked;
    safeStorageSet({ 'debugEnabled': debugState });
    chrome.runtime.sendMessage({
        action: 'toggleDebug',
        debugEnabled: debugState
    });
});
