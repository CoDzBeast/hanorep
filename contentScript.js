let extensionEnabled = true; // Default state

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleExtension") {
        extensionEnabled = message.extensionEnabled;
    } else if (extensionEnabled && message.action === "scrollElementIntoView") {
        scrollElementIntoView(message.iOrd1Id);
    }
});

console.log("Extension is running");

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

        chrome.storage.local.set({ 'currentOrderInfo': orderInfo });

        const newURL = `https://www.hattorihanzoshears.com/cgi-bin/AccountInfo.cfm?iOrder=${iOrd1Text}`;
        chrome.storage.local.get("lastOpenedURL", (data) => {
            if (data.lastOpenedURL !== newURL) {
                chrome.runtime.sendMessage({ url: newURL, iOrd1Id: iOrd1Text });
                chrome.storage.local.set({ lastOpenedURL: newURL });
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
        chrome.storage.local.get('currentOrderInfo', (data) => {
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
    console.log('Current value before update:', $('#ddRepCC').val());

    // Set new value and trigger update
    $('#ddRepCC').val('shipping@hanzonation.com').trigger('chosen:updated');

    // Debug new value after update
    console.log('New value after update:', $('#ddRepCC').val());

    // Debug selected options after update
    var selectedOptions = $('#ddRepCC').find(':selected').map(function() {
        return $(this).val();
    }).get();
    console.log('Selected options after update:', selectedOptions);

    // Additional check to ensure the visual component updates
    // If the visual update is not occurring, you may need to manually trigger a click or focus event
    $('#ddRepCC').trigger('chosen:open'); // This will open the Chosen dropdown
    $('#ddRepCC').trigger('chosen:close'); // This will close the Chosen dropdown
}

let sendButtonClicked = false;

function attachSendButtonListener() {
  const sendBtn = document.querySelector('#RepReq .btn-primary');
  if (!sendBtn) {
    setTimeout(attachSendButtonListener, 100);
    return;
  }
  sendBtn.addEventListener('click', () => {
    sendButtonClicked = true;
  });
}

function sendSigEmailThroughDropdown() {
  chrome.storage.local.get('currentOrderInfo', (data) => {
    const orderNumber = data.currentOrderInfo ? data.currentOrderInfo.orderNumber : null;
    let context = document;
    if (orderNumber) {
      const row = document.querySelector(`#OShip${orderNumber}`);
      if (row) {
        context = row;
      }
    }
    const orderBtn = context.querySelector('button.btn.btn-warning.btn-xs.dropdown-toggle.no-rad.hidden-sm.hidden-xs');
    if (orderBtn) {
      orderBtn.click();
      setTimeout(() => {
        const resendLink = document.querySelector('a[onclick="SendSigEmail();"]');
        if (resendLink) {
          resendLink.click();
        }
      }, 200);
    }
  });
}



function observeModal() {
  const repReqModal = document.querySelector('#RepReq');
  if (!repReqModal) {
    console.log("RepReq not found");
    setTimeout(observeModal, 100);
    return;
  }

  console.log("Found RepReq");
  const config = { attributes: true, attributeFilter: ["aria-hidden"] };

  const callback = function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "aria-hidden") {
        console.log("aria-hidden changed");
        if (repReqModal.getAttribute("aria-hidden") === "false") {
          console.log("Modal is visible");
          setTimeout(handleModalShowEvent, 100);
          setTimeout(setSelectedValueForChosen, 100);
          attachSendButtonListener();
        } else if (sendButtonClicked && repReqModal.getAttribute("aria-hidden") === "true") {
          sendButtonClicked = false;
          setTimeout(sendSigEmailThroughDropdown, 500);
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
