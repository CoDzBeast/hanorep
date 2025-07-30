importScripts('debugHelper.js');

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

let tabOpenedRecently = false;
let newTabId = null;
let extensionEnabled = true; // Default state

debugHelper.init();

safeStorageGet(['extensionEnabled'], function(result) {
    if (result.extensionEnabled !== undefined) {
        extensionEnabled = result.extensionEnabled;
    }
    debugHelper.log('Initial extensionEnabled state:', extensionEnabled);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.extensionEnabled) {
        extensionEnabled = changes.extensionEnabled.newValue;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleExtension") {
        extensionEnabled = request.extensionEnabled;
        safeStorageSet({ 'extensionEnabled': extensionEnabled });
        debugHelper.log('Extension enabled state changed:', extensionEnabled);
    } else if (request.action === "toggleDebug") {
        safeStorageSet({ 'debugEnabled': request.debugEnabled });
        debugHelper.log('Debug state changed:', request.debugEnabled);
    }

    if (extensionEnabled && request.url && !tabOpenedRecently) {
        debugHelper.log('Opening new tab for URL:', request.url);
        tabOpenedRecently = true;
        chrome.tabs.create({ url: request.url, active: true }, (tab) => {
            newTabId = tab.id;
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === "complete") {
                    debugHelper.log('New tab loaded:', request.url);
                    chrome.tabs.sendMessage(tab.id, { action: "newTabLoaded", iOrd1Id: request.iOrd1Id });
                    chrome.tabs.sendMessage(tab.id, {
                        action: "scrollElementIntoView",
                        iOrd1Id: request.iOrd1Id,
                    });
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === newTabId) {
        tabOpenedRecently = false;
        debugHelper.log('Tracked tab closed:', tabId);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (extensionEnabled && changeInfo.status === "complete" &&
        tab.url && tab.url.includes("https://www.hattorihanzoshears.com/cgi-bin/Shipping.cfm")) {
        debugHelper.log('Injecting contentScript into tab:', tabId);
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['debugHelper.js', 'contentScript.js']
        });
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (extensionEnabled && tab.url &&
            tab.url.includes("https://www.hattorihanzoshears.com/cgi-bin/Shipping.cfm")) {
            debugHelper.log('Injecting contentScript into active tab:', activeInfo.tabId);
            chrome.scripting.executeScript({
                target: { tabId: activeInfo.tabId },
                files: ['debugHelper.js', 'contentScript.js']
            });
        }
    });
});
