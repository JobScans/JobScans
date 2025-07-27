/* content.js */

// This script is injected into the job posting pages (LinkedIn, Indeed, etc.)

console.log("JobScans content script loaded!");

/**
 * This is the main entry point for our analysis logic.
 * It will be responsible for:
 * 1. Finding the relevant job data in the page's DOM (title, company, description).
 * 2. Running the "Red Flag" and "Outreach" analysis based on the logic we defined.
 * 3. Displaying a sidebar or UI element on the page with the results.
 * 4. Listening for a user action to "Flag as Suspicious".
 */

function analyzeJobPosting() {
    console.log("Analyzing job posting...");

    // --- Placeholder for DOM extraction ---
    // Example for LinkedIn job titles
    const jobTitleElement = document.querySelector('.jobs-unified-top-card__job-title');
    const companyElement = document.querySelector('.jobs-unified-top-card__company-name a');

    if (jobTitleElement && companyElement) {
        const jobTitle = jobTitleElement.innerText;
        const companyName = companyElement.innerText;

        console.log(`Found Job: ${jobTitle} at ${companyName}`);
        
        // In the future, we will send this data to the background script
        // for more detailed analysis and to display in a UI.
        chrome.runtime.sendMessage({
            type: 'JOB_DATA',
            payload: {
                title: jobTitle,
                company: companyName
            }
        });

    } else {
        console.log("Could not find job title or company on this page.");
    }
}

// Run the analysis when the page is loaded.
// We might need a more robust trigger, like waiting for the page to fully render.
window.addEventListener('load', analyzeJobPosting);


/* background.js */

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


/* popup.js */

// This script controls the behavior of the popup window.

document.addEventListener('DOMContentLoaded', () => {
    const messageElement = document.getElementById('message');
    const statusIndicator = document.getElementById('status-indicator');

    // Check if we are on a supported page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        if (url.includes('linkedin.com/jobs/view') || url.includes('indeed.com/viewjob')) {
            messageElement.textContent = 'Analysis complete. See sidebar on the page for details.';
            statusIndicator.classList.remove('bg-slate-400');
            statusIndicator.classList.add('bg-green-500');
            statusIndicator.title = "Status: Active on a supported page";
        }
    });

    // Make the archive link open the web app's archive page
    const archiveLink = document.getElementById('archive-link');
    archiveLink.addEventListener('click', (e) => {
        e.preventDefault();
        // In a real extension, you'd have the actual URL of your web app here
        chrome.tabs.create({ url: 'https://YOUR-WEBSITE-URL-HERE.com/archive' });
    });
});
