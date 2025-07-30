# Hattori Hanzo Automation Chrome Extension

This repository contains a Chrome extension that automates several tasks on the Hattori Hanzo Shears website.

## Purpose

The extension helps streamline the shipping workflow by automatically identifying orders that require a signature, opening those orders in a new tab, and assisting with resending the signature request email. A small popup allows you to enable or disable the extension and toggle debug logging.

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked** and select this project folder.
4. The extension will now appear in your list of extensions.

## Basic Functionality

- Monitors the shipping list on `hattorihanzoshears.com` and opens orders needing a signature.
- Automatically fills the Rep Request form and can resend the signature email for the selected order.
- Popup options allow you to toggle the automation on or off and enable debug logging.

## Prerequisites and Usage Notes

- Requires Google Chrome version 88 or higher (Manifest V3 support).
- You must be logged into the Hattori Hanzo system for the extension to operate correctly.
- When enabled, the extension may open new tabs automatically as it processes orders. Disable the extension via the popup if you do not want this behavior.


