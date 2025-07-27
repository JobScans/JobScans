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
        
        // 2. Create and inject our UI sidebar onto the page if it doesn't exist
        let sidebar = document.getElementById('jobscans-sidebar');
        if (!sidebar) {
            sidebar = createSidebar();
            document.body.appendChild(sidebar);
        }

        // 3. Run the analysis on the job data
        const analysisResults = runAnalysis(jobData);

        // 4. Populate the sidebar with the extracted data and analysis
        populateSidebar(sidebar, jobData, analysisResults);

        // 5. Send data to the background script for any further processing
        chrome.runtime.sendMessage({
            type: 'JOB_DATA',
            payload: jobData
        });

    } else {
        console.log("Could not find job title or company on this page.");
    }
}

// --- Analysis Engine ---

/**
 * Runs our analysis logic on the extracted job data.
 * @param {object} jobData - The extracted job data.
 * @returns {object} An object containing the analysis results.
 */
function runAnalysis(jobData) {
    const { title, description } = jobData;
    const results = {
        redFlags: [],
        outreachKeywords: []
    };
    const fullText = (title + ' ' + description).toLowerCase();

    // Define our keyword flags
    const redFlagKeywords = {
        "High-pressure language": ["urgent hire", "hiring immediately", "start today", "immediate start"],
        "Vague/unprofessional title": ["ninja", "rockstar", "guru", "evangelist"],
        "Potential scam phrasing": ["unlimited earning potential", "be your own boss", "multi-level marketing"],
    };

    // Check for red flag keywords
    for (const category in redFlagKeywords) {
        for (const keyword of redFlagKeywords[category]) {
            if (fullText.includes(keyword)) {
                results.redFlags.push({ category, keyword });
                // We break after finding one keyword in a category to avoid clutter
                break; 
            }
        }
    }
    
    // If no red flags, run the Outreach analysis
    if (results.redFlags.length === 0) {
        const outreachSkillKeywords = ["javascript", "react", "python", "node.js", "seo", "google analytics", "figma", "project management", "saas", "api", "sql", "aws"];
        outreachSkillKeywords.forEach(skill => {
            if (fullText.includes(skill)) {
                results.outreachKeywords.push(skill);
            }
        });
    }

    return results;
}


// --- Helper Functions ---

/**
 * Extracts job information from the DOM of the current page.
 * @returns {object|null} An object with job data or null if not found.
 */
function extractJobData() {
    // This is highly site-specific. We need robust selectors for each site.
    // Example for LinkedIn job pages:
    const jobTitleElement = document.querySelector('.jobs-unified-top-card__job-title, .top-card-layout__title');
    const companyElement = document.querySelector('.jobs-unified-top-card__company-name a, .topcard__org-name-link');
    const descriptionElement = document.querySelector('#job-details, .jobs-description__content');

    if (jobTitleElement && companyElement) {
        return {
            title: jobTitleElement.innerText.trim(),
            company: companyElement.innerText.trim(),
            description: descriptionElement ? descriptionElement.innerText.trim() : 'Description not found.'
        };
    }
    // TODO: Add selectors for Indeed and other sites
    return null;
}

/**
 * Creates the main sidebar container element.
 * @returns {HTMLElement} The created sidebar element.
 */
function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'jobscans-sidebar';
    sidebar.innerHTML = `
        <div id="jobscans-sidebar-content">
            <div class="header">
                <h3>Job<span class="logo-span">Scans</span></h3>
                <button id="jobscans-close-btn">&times;</button>
            </div>
            <div id="jobscans-analysis-container">
                <p class="loading-text">Analyzing job post...</p>
            </div>
        </div>
    `;
    
    applyStyles(sidebar);

    sidebar.querySelector('#jobscans-close-btn').addEventListener('click', () => {
        sidebar.remove();
    });

    setTimeout(() => sidebar.classList.add('visible'), 100);

    return sidebar;
}

/**
 * Populates the sidebar with job data and analysis results.
 * @param {HTMLElement} sidebar - The sidebar element.
 * @param {object} jobData - The extracted job data.
 * @param {object} analysisResults - The results from our analysis engine.
 */
function populateSidebar(sidebar, jobData, analysisResults) {
    const container = sidebar.querySelector('#jobscans-analysis-container');
    let analysisHTML = '';

    if (analysisResults.redFlags.length > 0) {
        // Render Red Flags
        analysisHTML = `
            <h5><span class="icon-warn">⚠️</span> Red Flag Analysis</h5>
            <ul class="analysis-list">
                ${analysisResults.redFlags.map(flag => `<li><strong>${flag.category}:</strong> Found term "${flag.keyword}".</li>`).join('')}
            </ul>
        `;
    } else {
        // Render Outreach Toolkit
        const keywordsHTML = analysisResults.outreachKeywords.length > 0 
            ? analysisResults.outreachKeywords.map(skill => `<li class="keyword-item">${skill}</li>`).join('')
            : '<li>No specific skills found to highlight. Review the description carefully.</li>';

        analysisHTML = `
            <h5><span class="icon-good">✅</span> Outreach Toolkit</h5>
            <p class="toolkit-desc">No major red flags detected. Use these keywords to tailor your resume for ATS screening.</p>
            <ul class="outreach-keywords">
                ${keywordsHTML}
            </ul>
        `;
    }

    container.innerHTML = `
        <div class="job-info">
            <h4>${jobData.title}</h4>
            <p>${jobData.company}</p>
        </div>
        <hr class="divider">
        <div class="analysis-section">
            ${analysisHTML}
        </div>
        <div class="actions">
            <button id="flag-job-btn">Flag as Suspicious</button>
        </div>
    `;

    sidebar.querySelector('#flag-job-btn').addEventListener('click', () => {
        console.log("Flag button clicked! This will eventually open a form to submit to the community archive.");
        // We avoid using alert() as it's disruptive.
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
            --jobscans-warn-bg: #fefce8;
            --jobscans-warn-text: #854d0e;
            --jobscans-warn-border: #fde047;
            --jobscans-good-bg: #f0fdf4;
            --jobscans-good-text: #166534;
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
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--jobscans-border); padding-bottom: 12px; margin-bottom: 16px; }
        .header h3 { font-size: 20px; font-weight: 700; margin: 0; }
        .logo-span { color: var(--jobscans-primary); }
        #jobscans-close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #94a3b8; padding: 0; line-height: 1; }
        .job-info h4 { font-size: 18px; font-weight: 600; margin: 0 0 4px 0; }
        .job-info p { font-size: 14px; color: #64748b; margin: 0; }
        .divider { border: none; border-top: 1px solid var(--jobscans-border); margin: 16px 0; }
        .analysis-section h5 { font-size: 16px; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; }
        .analysis-section h5 .icon-warn { margin-right: 8px; font-size: 20px; }
        .analysis-section h5 .icon-good { margin-right: 8px; font-size: 16px; }
        .analysis-list { list-style: none; padding: 0; margin: 0; font-size: 14px; color: #475569; background-color: var(--jobscans-warn-bg); border: 1px solid var(--jobscans-warn-border); padding: 12px; border-radius: 8px; }
        .analysis-list li { margin-bottom: 8px; }
        .analysis-list li:last-child { margin-bottom: 0; }
        .toolkit-desc { font-size: 14px; color: #475569; margin-top: -8px; margin-bottom: 12px; }
        .outreach-keywords { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .keyword-item { font-size: 12px; background-color: var(--jobscans-good-bg); color: var(--jobscans-good-text); padding: 4px 8px; border-radius: 16px; font-weight: 500; }
        .actions { margin-top: 20px; }
        #flag-job-btn { width: 100%; background-color: #fecaca; color: #991b1b; border: 1px solid #fca5a5; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        #flag-job-btn:hover { background-color: #fca5a5; }
        .loading-text { color: #64748b; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    element.appendChild(styleSheet);
}


// --- Entry Point ---
// We use a MutationObserver to robustly wait for the job elements to be available on the page,
// as modern sites like LinkedIn load content dynamically.
const observer = new MutationObserver((mutations, obs) => {
    const targetElement = document.querySelector('.jobs-unified-top-card__job-title, .top-card-layout__title');
    if (targetElement) {
        if (!document.getElementById('jobscans-sidebar')) {
            analyzeJobPosting();
        }
        // We don't disconnect anymore to handle dynamic page navigation on some job sites.
        // A more robust solution would be needed for single-page apps.
    }
});

// Start observing the document body for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});
