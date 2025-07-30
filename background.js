let tabOpenedRecently = false;
let newTabId = null;
let extensionEnabled = true; // Default state
let debugEnabled = false;

function debugLog(...args) {
    if (debugEnabled) {
        console.log(...args);
    }
}

chrome.storage.local.get(['extensionEnabled', 'debugEnabled'], function(result) {
    if (result.extensionEnabled !== undefined) {
        extensionEnabled = result.extensionEnabled;
    }
    if (result.debugEnabled !== undefined) {
        debugEnabled = result.debugEnabled;
    }
    debugLog('Initial states - extensionEnabled:', extensionEnabled, 'debugEnabled:', debugEnabled);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleExtension") {
        extensionEnabled = request.extensionEnabled;
        chrome.storage.local.set({ 'extensionEnabled': extensionEnabled });
        debugLog('Extension enabled state changed:', extensionEnabled);
    } else if (request.action === "toggleDebug") {
        debugEnabled = request.debugEnabled;
        chrome.storage.local.set({ 'debugEnabled': debugEnabled });
        debugLog('Debug state changed:', debugEnabled);
    }

    if (extensionEnabled && request.url && !tabOpenedRecently) {
        debugLog('Opening new tab for URL:', request.url);
        tabOpenedRecently = true;
        chrome.tabs.create({ url: request.url, active: true }, (tab) => {
            newTabId = tab.id;
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === "complete") {
                    debugLog('New tab loaded:', request.url);
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
        debugLog('Tracked tab closed:', tabId);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (extensionEnabled && changeInfo.status === "complete" &&
        tab.url && tab.url.includes("https://www.hattorihanzoshears.com/cgi-bin/Shipping.cfm")) {
        debugLog('Injecting contentScript into tab:', tabId);
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['contentScript.js']
        });
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (extensionEnabled && tab.url &&
            tab.url.includes("https://www.hattorihanzoshears.com/cgi-bin/Shipping.cfm")) {
            debugLog('Injecting contentScript into active tab:', activeInfo.tabId);
            chrome.scripting.executeScript({
                target: { tabId: activeInfo.tabId },
                files: ['contentScript.js']
            });
        }
    });
});
