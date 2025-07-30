const toggleSwitch = document.getElementById('toggleSwitch');
const debugSwitch = document.getElementById('debugSwitch');

// Load the stored state and update the switch
chrome.storage.local.get('extensionEnabled', function(data) {
    toggleSwitch.checked = data.extensionEnabled !== undefined ? data.extensionEnabled : true;
});
chrome.storage.local.get('debugEnabled', function(data) {
    debugSwitch.checked = data.debugEnabled === true;
});

// Save the new state whenever the switch is toggled
toggleSwitch.addEventListener('change', function() {
    const newState = this.checked;
    chrome.storage.local.set({ 'extensionEnabled': newState });
    chrome.runtime.sendMessage({
        action: 'toggleExtension',
        extensionEnabled: newState
    });
});

debugSwitch.addEventListener('change', function() {
    const debugState = this.checked;
    chrome.storage.local.set({ 'debugEnabled': debugState });
    chrome.runtime.sendMessage({
        action: 'toggleDebug',
        debugEnabled: debugState
    });
});
