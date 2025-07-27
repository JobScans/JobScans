// This is the service worker. It runs in the background of the browser.
// It's the central hub for the extension.

console.log("JobScans background service worker started.");

// Listens for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JOB_DATA') {
        console.log("Received job data from content script:", message.payload);
        
        // Here we would perform more complex logic, like:
        // 1. Storing the data in chrome.storage.
        // 2. Cross-referencing with the public flagged jobs database.
        // 3. Updating the popup UI.
    }
});
