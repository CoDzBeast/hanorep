let tabOpenedRecently = false;
let newTabId = null;
let extensionEnabled = true; // Default state

chrome.storage.local.get(['extensionEnabled'], function(result) {
    if (result.extensionEnabled !== undefined) {
        extensionEnabled = result.extensionEnabled;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleExtension") {
        extensionEnabled = request.extensionEnabled;
        chrome.storage.local.set({ 'extensionEnabled': extensionEnabled });
    }

    if (extensionEnabled && request.url && !tabOpenedRecently) {
        tabOpenedRecently = true;
        chrome.tabs.create({ url: request.url, active: true }, (tab) => {
            newTabId = tab.id;
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === "complete") {
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
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (extensionEnabled && changeInfo.status === "complete" &&
        tab.url && tab.url.includes("https://www.hattorihanzoshears.com/cgi-bin/Shipping.cfm")) {
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
            chrome.scripting.executeScript({
                target: { tabId: activeInfo.tabId },
                files: ['contentScript.js']
            });
        }
    });
});
