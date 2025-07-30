(function() {
    const globalObj = typeof window !== 'undefined' ? window : self;

    if (globalObj.debugHelper) {
        return; // already initialized
    }

    let debugEnabled = false;

    function init() {
        chrome.storage.local.get('debugEnabled', (data) => {
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
