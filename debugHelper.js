(function() {
    const globalObj = typeof window !== 'undefined' ? window : self;

    if (globalObj.debugHelper) {
        return; // already initialized
    }

    let debugEnabled = false;

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

    function init() {
        safeStorageGet('debugEnabled', (data) => {
            if (data.debugEnabled !== undefined) {
                debugEnabled = data.debugEnabled;
            }
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.debugEnabled) {
                debugEnabled = changes.debugEnabled.newValue;
            }
        });
    }

    function log(...args) {
        if (debugEnabled) {
            console.log(...args);
        }
    }

    globalObj.debugHelper = { init, log };
})();
