// This script is injected into the job posting pages (LinkedIn, Indeed, etc.)

console.log("JobScans content script loaded!");

// --- Main Analysis Function ---
/**
 * This is the main entry point for our analysis logic.
 * It finds job data, creates our UI, and displays the information.
 */
function analyzeJobPosting() {
    console.log("Analyzing job posting...");

    // 1. Extract job data from the page's DOM
    const jobData = extractJobData();

    if (jobData) {
        console.log(`Found Job: ${jobData.title} at ${jobData.company}`);
        
        // 2. Create and inject our UI sidebar onto the page
        const sidebar = createSidebar();
        document.body.appendChild(sidebar);

        // 3. Populate the sidebar with the extracted data and analysis
        populateSidebar(sidebar, jobData);

        // 4. Send data to the background script for any further processing
        chrome.runtime.sendMessage({
            type: 'JOB_DATA',
            payload: jobData
        });

    } else {
        console.log("Could not find job title or company on this page.");
    }
}

// --- Helper Functions ---

/**
 * Extracts job information from the DOM of the current page.
 * @returns {object|null} An object with job data or null if not found.
 */
function extractJobData() {
    // This is highly site-specific. We need robust selectors for each site.
    // Example for LinkedIn job pages:
    const jobTitleElement = document.querySelector('.jobs-unified-top-card__job-title');
    const companyElement = document.querySelector('.jobs-unified-top-card__company-name a');
    const descriptionElement = document.querySelector('#job-details'); // Example selector

    if (jobTitleElement && companyElement) {
        return {
            title: jobTitleElement.innerText.trim(),
            company: companyElement.innerText.trim(),
            description: descriptionElement ? descriptionElement.innerText.trim() : 'Description not found.'
        };
    }
    // Add more selectors for Indeed and other sites here...
    return null;
}

/**
 * Creates the main sidebar container element.
 * @returns {HTMLElement} The created sidebar element.
 */
function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'jobscans-sidebar';
    // The sidebar is initially styled to be hidden and will be shown with a class
    sidebar.innerHTML = `
        <div id="jobscans-sidebar-content">
            <div class="header">
                <h3>Job<span class="logo-span">Scans</span></h3>
                <button id="jobscans-close-btn">&times;</button>
            </div>
            <div id="jobscans-analysis-container">
                <p>Loading analysis...</p>
            </div>
        </div>
    `;
    
    // Add styles to the sidebar
    applyStyles(sidebar);

    // Add close functionality
    sidebar.querySelector('#jobscans-close-btn').addEventListener('click', () => {
        sidebar.classList.remove('visible');
    });

    // Make sidebar visible after a short delay to allow for transition
    setTimeout(() => sidebar.classList.add('visible'), 100);

    return sidebar;
}

/**
 * Populates the sidebar with job data and analysis results.
 * @param {HTMLElement} sidebar - The sidebar element.
 * @param {object} jobData - The extracted job data.
 */
function populateSidebar(sidebar, jobData) {
    const container = sidebar.querySelector('#jobscans-analysis-container');
    
    // For now, we'll just display the basic info.
    // This is where our "Red Flag" and "Outreach" logic will go.
    container.innerHTML = `
        <div class="job-info">
            <h4>${jobData.title}</h4>
            <p>${jobData.company}</p>
        </div>
        <hr class="divider">
        <div class="analysis-section">
            <h5>Analysis (Coming Soon)</h5>
            <ul class="analysis-list">
                <li>- Red Flag Checks</li>
                <li>- Outreach Toolkit</li>
            </ul>
        </div>
        <div class="actions">
            <button id="flag-job-btn">Flag as Suspicious</button>
        </div>
    `;

    // Add event listener for the flag button
    sidebar.querySelector('#flag-job-btn').addEventListener('click', () => {
        console.log("Flag button clicked!");
        // Future logic: Show a form to ask for reason, then send to background script.
        alert('This will flag the job in the community archive!');
    });
}

/**
 * Applies CSS styles to the sidebar element.
 * @param {HTMLElement} element - The element to style.
 */
function applyStyles(element) {
    const styles = `
        :host {
            --jobscans-bg: #f8fafc;
            --jobscans-text: #1e293b;
            --jobscans-primary: #4f46e5;
            --jobscans-border: #e2e8f0;
            --jobscans-white: #ffffff;
            --jobscans-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        }
        #jobscans-sidebar {
            position: fixed;
            top: 20px;
            right: -400px; /* Start off-screen */
            width: 350px;
            max-height: calc(100vh - 40px);
            background-color: var(--jobscans-bg);
            border: 1px solid var(--jobscans-border);
            border-radius: 12px;
            box-shadow: var(--jobscans-shadow);
            z-index: 9999999;
            font-family: 'Inter', sans-serif;
            color: var(--jobscans-text);
            transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            display: flex;
            flex-direction: column;
        }
        #jobscans-sidebar.visible {
            right: 20px;
        }
        #jobscans-sidebar-content {
            padding: 20px;
            overflow-y: auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--jobscans-border);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
        }
        .logo-span {
            color: var(--jobscans-primary);
        }
        #jobscans-close-btn {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #94a3b8;
            padding: 0;
            line-height: 1;
        }
        .job-info h4 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 4px 0;
        }
        .job-info p {
            font-size: 14px;
            color: #64748b;
            margin: 0;
        }
        .divider {
            border: none;
            border-top: 1px solid var(--jobscans-border);
            margin: 16px 0;
        }
        .analysis-section h5 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }
        .analysis-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 14px;
            color: #475569;
        }
        .actions {
            margin-top: 20px;
        }
        #flag-job-btn {
            width: 100%;
            background-color: #fecaca;
            color: #991b1b;
            border: 1px solid #fca5a5;
            padding: 10px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        #flag-job-btn:hover {
            background-color: #fca5a5;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    element.appendChild(styleSheet);
}


// --- Entry Point ---
// We use a MutationObserver to robustly wait for the job elements to be available on the page,
// as modern sites like LinkedIn load content dynamically.
const observer = new MutationObserver((mutations, obs) => {
    // Look for a key element that indicates the job posting is loaded
    const targetElement = document.querySelector('.jobs-unified-top-card__job-title');
    if (targetElement) {
        // Element found, run our analysis and then disconnect the observer
        // We check if the sidebar already exists to prevent re-running
        if (!document.getElementById('jobscans-sidebar')) {
            analyzeJobPosting();
        }
        obs.disconnect(); // Stop observing once we've found our target
    }
});

// Start observing the document body for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});
