if (!window.hanzoContentScriptInitialized) {
    window.hanzoContentScriptInitialized = true;

    debugHelper.init();
    const debugLog = debugHelper.log;

    // Ensure the Chrome storage API is available before using it
    if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.error('chrome.storage.local is unavailable');
    }

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

    var extensionEnabled = true; // Default state

    safeStorageGet('extensionEnabled', (data) => {
        if (data.extensionEnabled !== undefined) {
            extensionEnabled = data.extensionEnabled;
        }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.extensionEnabled) {
            extensionEnabled = changes.extensionEnabled.newValue;
        }
    });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleExtension") {
        extensionEnabled = message.extensionEnabled;
        debugLog('Extension enabled state changed:', extensionEnabled);
    } else if (message.action === "toggleDebug") {
        debugLog('Debug state changed:', message.debugEnabled);
    } else if (extensionEnabled && message.action === "scrollElementIntoView") {
        scrollElementIntoView(message.iOrd1Id);
    }
});

debugLog("Content script running");

async function openCust0Link() {
    const currentURL = new URL(window.location.href);

    if (currentURL.searchParams.get("openedByExtension")) return;

    const pencilIcons = document.querySelectorAll(".pull-right.fa.fa-pencil-square-o.fa-2x");

    let warningPencilIcon = null;
    let successPencilIcon = null;

    pencilIcons.forEach((icon) => {
        if (icon.classList.contains("text-warning")) {
            warningPencilIcon = icon;
        }
        if (icon.classList.contains("text-success")) {
            successPencilIcon = icon;
        }
    });

    if (warningPencilIcon && !successPencilIcon) {
        const iOrd1Element = document.querySelector("#iOrd1");
        const iOrd1Text = iOrd1Element.textContent;
        const dOrd1Element = document.querySelector("#dOrd1");
        const dOrd1FullText = dOrd1Element.textContent;
        
        // Splitting and formatting the date to include only month and day
        const dOrd1DateParts = dOrd1FullText.split(',')[0].trim(); // Assuming the format is "Dec 24, 2022 / 7:33 AM"
        const dOrd1MonthDay = dOrd1DateParts.split(' ')[0] + ' ' + dOrd1DateParts.split(' ')[1]; // Keeping only "Dec 24"

        const orderInfo = {
            orderNumber: iOrd1Text,
            orderDate: dOrd1MonthDay
        };

        safeStorageSet({ 'currentOrderInfo': orderInfo });

        const newURL = `https://www.hattorihanzoshears.com/cgi-bin/AccountInfo.cfm?iOrder=${iOrd1Text}`;
        safeStorageGet("lastOpenedURL", (data) => {
            if (data.lastOpenedURL !== newURL) {
                chrome.runtime.sendMessage({ url: newURL, iOrd1Id: iOrd1Text });
                safeStorageSet({ lastOpenedURL: newURL });
            }
        });
    }
}

function scrollElementIntoView(orderNumber) {
    const element = document.querySelector(`[id="OShip${orderNumber}"]`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function observeBody() {
    const targetNode = document.querySelector("body");

    if (targetNode) {
        const config = { attributes: true, childList: true, subtree: true, attributeFilter: ["class"] };

        const callback = function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === "attributes" && mutation.attributeName === "class") {
                    openCust0Link();
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } else {
        setTimeout(observeBody, 1000);
    }
}

function handleModalShowEvent() {
    const rrqText = document.querySelector("#RRqText");
    const txtEmailSubject = document.querySelector("#txtEmailSubject");

    // Make sure you call the setSelectedValueForChosen function after ensuring the DOM elements are present
    if (rrqText && txtEmailSubject) {
        safeStorageGet('currentOrderInfo', (data) => {
            if (data.currentOrderInfo) {
                const { orderNumber, orderDate } = data.currentOrderInfo;
                rrqText.value = `Order ${orderNumber} from ${orderDate} needs a signature on file in order to ship. To ensure efficiency, could you please provide the necessary signature at your earliest convenience? Once we receive this, we will expedite the shipping process to get your order to you as soon as possible. Thank you for your attention to this matter.`;
                txtEmailSubject.value = `Order ${orderNumber}`;

                // Call the chosen value setter after the data is retrieved and elements are confirmed to be present
            }
        });
    }
}

function setSelectedValueForChosen() {
    // Check for jQuery
    if (typeof jQuery === 'undefined') {
        console.error('jQuery is not loaded');
        return;
    }

    // Check for Chosen
    if (typeof jQuery.fn.chosen === 'undefined') {
        console.error('Chosen plugin is not loaded');
        return;
    }

    // Debug current value
    debugLog('Current value before update:', $('#ddRepCC').val());

    // Set new value and trigger update
    $('#ddRepCC').val('shipping@hanzonation.com').trigger('chosen:updated');

    // Debug new value after update
    debugLog('New value after update:', $('#ddRepCC').val());

    // Debug selected options after update
    var selectedOptions = $('#ddRepCC').find(':selected').map(function() {
        return $(this).val();
    }).get();
    debugLog('Selected options after update:', selectedOptions);

    // Additional check to ensure the visual component updates
    // If the visual update is not occurring, you may need to manually trigger a click or focus event
    $('#ddRepCC').trigger('chosen:open'); // This will open the Chosen dropdown
    $('#ddRepCC').trigger('chosen:close'); // This will close the Chosen dropdown
}


function showEmailSentNotification() {
  const notification = document.createElement('div');
  notification.textContent = 'Signature request email sent.';
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#4caf50',
    color: '#fff',
    padding: '10px',
    borderRadius: '4px',
    zIndex: 9999,
    fontSize: '14px',
  });
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

function waitForElement(selector, context = document, timeout = 10000, interval = 200) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const el = context.querySelector(selector);
      if (el) {
        resolve(el);
      } else if (Date.now() - start >= timeout) {
        resolve(null);
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

function simulateMouseEvents(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const params = {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
  ["mousemove", "mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
    element.dispatchEvent(new MouseEvent(type, params));
  });
}

function attachSendButtonListener() {
  const sendBtn = document.querySelector('#RepReq .btn-primary');
  if (!sendBtn) {
    setTimeout(attachSendButtonListener, 100);
    return;
  }
  if (sendBtn.dataset.listenerAttached) return;
  sendBtn.dataset.listenerAttached = 'true';
  sendBtn.addEventListener('click', () => {
    debugLog('Send button clicked');
    waitForModalToClose(sendSigEmailThroughDropdown);
  });
}

function waitForModalToClose(callback) {
  const repReqModal = document.querySelector('#RepReq');
  if (!repReqModal) {
    callback();
    return;
  }
  const check = () => {
    const hidden =
      !document.body.contains(repReqModal) ||
      repReqModal.getAttribute('aria-hidden') === 'true';
    if (hidden) {
      debugLog('RepReq modal hidden');
      setTimeout(callback, 500);
    } else {
      setTimeout(check, 100);
    }
  };
  check();
}

function sendSigEmailThroughDropdown() {
  safeStorageGet('currentOrderInfo', async (data) => {
    const orderNumber = data.currentOrderInfo ? data.currentOrderInfo.orderNumber : null;
    let context = document;
    if (orderNumber) {
      const row = document.querySelector(`#OShip${orderNumber}`);
      if (row) {
        context = row;
      }
    }

    debugLog('Searching for order dropdown button');
    let orderBtn = await waitForElement(
      'button.btn.btn-warning.btn-xs.dropdown-toggle.no-rad.hidden-sm.hidden-xs',
      context
    );
    if (!orderBtn) {
      orderBtn = await waitForElement(
        'button.btn-warning.dropdown-toggle, a.btn-warning.dropdown-toggle',
        context
      );
    }
    if (orderBtn) {
      debugLog('Order dropdown button found');
      simulateMouseEvents(orderBtn);
      // Wait for the dropdown menu to expand
      await new Promise((r) => setTimeout(r, 500));
      debugLog('Looking for resend link within context');
      const resendSelectors =
        'li.Sig0 a[onclick*="SendSigEmail"], li.Sig0 a[href*="SendSigEmail"], a[onclick*="SendSigEmail"], a[href*="SendSigEmail"]';
      let resendLink = await waitForElement(resendSelectors, context, 5000);
      if (!resendLink) {
        debugLog('Resend link not found in context, searching document');
        resendLink = await waitForElement(resendSelectors);
      }
      if (resendLink) {
        debugLog('Resend link found, sending email');
        simulateMouseEvents(resendLink);
        showEmailSentNotification();
      } else {
        debugLog('Resend link not found');
      }
    } else {
      debugLog('Order dropdown button not found');
    }
  });
}



function observeModal() {
  const repReqModal = document.querySelector('#RepReq');
  if (!repReqModal) {
    debugLog("RepReq not found");
    setTimeout(observeModal, 100);
    return;
  }

  debugLog("Found RepReq");
  const config = { attributes: true, attributeFilter: ["aria-hidden"] };

  const callback = function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "aria-hidden") {
        debugLog("aria-hidden changed");
        if (repReqModal.getAttribute("aria-hidden") === "false") {
          debugLog("Modal is visible");
          setTimeout(handleModalShowEvent, 100);
          setTimeout(setSelectedValueForChosen, 100);
          attachSendButtonListener();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(repReqModal, config);
}

if (extensionEnabled) {
    observeBody();
    observeModal();
}

} // End check for initialization
