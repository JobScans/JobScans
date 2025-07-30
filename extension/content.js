
// This script is injected into the job posting pages (LinkedIn, Indeed, etc.)

console.log("JobScans content script loaded!");

// --- Main Analysis Function ---
/**
 * This is the main entry point for our analysis logic.
 * It finds job data, creates our UI, and displays the information.
 */
async function analyzeJobPosting() {
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

        // 3. Check community archive by messaging the background script
        const communityAlert = await checkCommunityArchive(jobData);

        // 4. Run the local analysis on the job data
        const analysisResults = runAnalysis(jobData);

        // 5. Populate the sidebar with all data and analysis
        populateSidebar(sidebar, jobData, analysisResults, communityAlert);

        // 6. Send data to the background script for any further processing
        chrome.runtime.sendMessage({ type: 'JOB_DATA', payload: jobData });

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
    const { title, company, description } = jobData;
    const results = {
        redFlags: [],
        outreach: {
            hardSkills: [],
            softSkills: [],
            tone: 'Neutral'
        }
    };
    const fullText = (title + ' ' + description).toLowerCase();
    const companyLower = company.toLowerCase();

    // --- Red Flag Analysis ---
    const redFlagChecks = {
        "Vague/unprofessional title": ["ninja", "rockstar", "guru", "evangelist"],
        "High-pressure language": ["urgent hire", "hiring immediately", "start today", "immediate start"],
        "Potential scam phrasing": ["unlimited earning potential", "be your own boss", "multi-level marketing", "no experience necessary"],
        "Confidential company": ["confidential", "private company", "stealth startup", "a leading firm"],
        "Generic contact email": /([a-zA-Z0-9._-]+@(gmail|yahoo|hotmail|outlook)\.com)/g,
        "Missing salary": !/(salary|pay|rate|\$)/g.test(fullText)
    };

    // Check keyword-based flags
    for (const category in redFlagChecks) {
        if (Array.isArray(redFlagChecks[category])) {
            for (const keyword of redFlagChecks[category]) {
                const sourceText = category === "Confidential company" ? companyLower : fullText;
                if (sourceText.includes(keyword)) {
                    results.redFlags.push({ category, detail: `Found term: "${keyword}"` });
                    break;
                }
            }
        }
    }
    // Check regex-based flags
    const genericEmailMatch = fullText.match(redFlagChecks["Generic contact email"]);
    if (genericEmailMatch) {
        results.redFlags.push({ category: "Generic contact email", detail: `Found email: ${genericEmailMatch[0]}` });
    }
    // Check boolean flags
    if (redFlagChecks["Missing salary"]) {
        results.redFlags.push({ category: "Missing salary", detail: "No salary information found in the description." });
    }

    // --- Outreach Toolkit Analysis (only if no major red flags) ---
    if (results.redFlags.length === 0) {
        const skills = {
            hard: ["javascript", "react", "python", "node.js", "seo", "google analytics", "figma", "project management", "saas", "api", "sql", "aws", "photoshop", "illustrator", "jira"],
            soft: ["communication", "teamwork", "leadership", "problem-solving", "critical thinking", "adaptability", "creativity"]
        };
        skills.hard.forEach(skill => { if (fullText.includes(skill)) results.outreach.hardSkills.push(skill); });
        skills.soft.forEach(skill => { if (fullText.includes(skill)) results.outreach.softSkills.push(skill); });

        // Tone analysis
        if (fullText.includes("we're looking for") || fullText.includes("join our team")) results.outreach.tone = 'Casual & Friendly';
        if (fullText.includes("the ideal candidate will possess") || fullText.includes("responsibilities include")) results.outreach.tone = 'Formal & Corporate';
    }

    return results;
}

// --- Helper Functions ---

/**
 * Extracts job information from the DOM of the current page.
 * @returns {object|null} An object with job data or null if not found.
 */
function extractJobData() {
    const jobTitleElement = document.querySelector('.jobs-unified-top-card__job-title, .top-card-layout__title');
    const companyElement = document.querySelector('.jobs-unified-top-card__company-name a, .topcard__org-name-link');
    const descriptionElement = document.querySelector('#job-details, .jobs-description__content');

    if (jobTitleElement && companyElement) {
        return {
            title: jobTitleElement.innerText.trim(),
            company: companyElement.innerText.trim(),
            description: descriptionElement ? descriptionElement.innerText.trim() : 'Description not found.',
            url: window.location.href
        };
    }
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
    sidebar.querySelector('#jobscans-close-btn').addEventListener('click', () => sidebar.remove());
    setTimeout(() => sidebar.classList.add('visible'), 100);
    return sidebar;
}

/**
 * Populates the sidebar with job data and analysis results.
 */
function populateSidebar(sidebar, jobData, analysisResults, communityAlert) {
    const container = sidebar.querySelector('#jobscans-analysis-container');
    let analysisHTML = '';
    let communityAlertHTML = '';

    if (communityAlert) {
        communityAlertHTML = `
            <div class="community-alert">
                <h5><span class="icon-community">🛡️</span> Community Alert</h5>
                <p>A similar job was flagged as: "<strong>${communityAlert.reason}</strong>"</p>
            </div>
        `;
    }

    if (analysisResults.redFlags.length > 0) {
        analysisHTML = `
            <h5><span class="icon-warn">⚠️</span> Red Flag Analysis</h5>
            <ul class="analysis-list">
                ${analysisResults.redFlags.map(flag => `<li><strong>${flag.category}:</strong> ${flag.detail}</li>`).join('')}
            </ul>`;
    } else {
        const outreach = analysisResults.outreach;
        analysisHTML = `
            <h5><span class="icon-good">✅</span> Outreach Toolkit</h5>
            <div class="toolkit-section">
                <h6>Identified Skills</h6>
                <p class="toolkit-desc">Hard Skills:</p>
                <ul class="outreach-keywords">${outreach.hardSkills.length ? outreach.hardSkills.map(s => `<li class="keyword-item hard">${s}</li>`).join('') : '<li>None found</li>'}</ul>
                <p class="toolkit-desc">Soft Skills:</p>
                <ul class="outreach-keywords">${outreach.softSkills.length ? outreach.softSkills.map(s => `<li class="keyword-item soft">${s}</li>`).join('') : '<li>None found</li>'}</ul>
            </div>
            <div class="toolkit-section">
                <h6>Company Voice</h6>
                <p class="toolkit-desc tone">${outreach.tone}</p>
            </div>
            <div class="toolkit-section">
                <h6>Smart Research</h6>
                ${generateResearchLinks(jobData.company)}
            </div>
        `;
    }

    container.innerHTML = `
        ${communityAlertHTML}
        <div class="job-info">
            <h4>${jobData.title}</h4>
            <p>${jobData.company}</p>
        </div>
        <hr class="divider">
        <div class="analysis-section">${analysisHTML}</div>
        <div class="actions">
            <button id="flag-job-btn">Flag as Suspicious</button>
        </div>
    `;

    sidebar.querySelector('#flag-job-btn').addEventListener('click', () => showFlaggingForm(jobData));
}

/**
 * Creates and shows a modal form for flagging a job.
 */
function showFlaggingForm(jobData) {
    if (document.getElementById('jobscans-flag-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'jobscans-flag-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h4>Flag Job Post</h4>
            <p>Why are you flagging "<strong>${jobData.title}</strong>"? Your report is anonymous and helps the community.</p>
            <select id="flag-reason">
                <option value="">Select a reason...</option>
                <option value="This appears to be a 'ghost job' (never hires).">Ghost Job (never hires)</option>
                <option value="The job description is misleading or inaccurate.">Misleading Description</option>
                <option value="This feels like a scam or data collection scheme.">Potential Scam</option>
                <option value="The company has a bad reputation.">Bad Company Reputation</option>
                <option value="other">Other (please specify)</option>
            </select>
            <textarea id="flag-other-reason" placeholder="Please provide details..." style="display:none;"></textarea>
            <div class="modal-actions">
                <button id="cancel-flag-btn">Cancel</button>
                <button id="submit-flag-btn">Submit Anonymous Report</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const reasonSelect = modal.querySelector('#flag-reason');
    const otherReasonText = modal.querySelector('#flag-other-reason');
    reasonSelect.onchange = () => {
        otherReasonText.style.display = reasonSelect.value === 'other' ? 'block' : 'none';
    };

    modal.querySelector('#cancel-flag-btn').onclick = () => modal.remove();
    modal.querySelector('#submit-flag-btn').onclick = () => {
        const reason = reasonSelect.value;
        if (!reason) {
            alert("Please select a reason.");
            return;
        }
        const fullReason = reason === 'other' ? otherReasonText.value : reason;
        if (!fullReason) {
            alert("Please provide a reason.");
            return;
        }
        
        // Send message to background script to save to Firestore
        chrome.runtime.sendMessage({
            type: 'FLAG_JOB',
            payload: { ...jobData, reason: fullReason, flaggedAt: new Date().toISOString() }
        }, (response) => {
            if (response.status === 'success') {
                console.log("Flag submitted successfully.");
                // You could show a success message in the UI here
            } else {
                console.error("Failed to submit flag:", response.error);
            }
        });
        
        modal.remove();
    };
}

/**
 * Generates HTML for smart research links.
 */
function generateResearchLinks(companyName) {
    const encodedCompany = encodeURIComponent(companyName);
    return `
        <ul class="research-links">
            <li><a href="https://www.google.com/search?q=${encodedCompany}+reviews" target="_blank">Google News & Reviews</a></li>
            <li><a href="https://www.linkedin.com/company/${encodedCompany.toLowerCase().replace(/\s+/g, '-')}" target="_blank">LinkedIn Company Page</a></li>
            <li><a href="https://www.glassdoor.com/Search/results.htm?keyword=${encodedCompany}" target="_blank">Glassdoor Profile</a></li>
        </ul>
    `;
}

/**
 * Checks the community archive by sending a message to the background script.
 */
async function checkCommunityArchive(jobData) {
    console.log("Sending message to check archive for:", jobData.title);
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_ARCHIVE',
            payload: { title: jobData.title, company: jobData.company }
        });

        if (response.status === 'success' && response.payload) {
            console.log("Received community alert from background script:", response.payload);
            return response.payload;
        }
        return null;
    } catch (error) {
        console.error("Error communicating with background script:", error);
        return null;
    }
}

/**
 * Applies CSS styles to the sidebar and modal elements.
 */
function applyStyles(element) {
    const styles = `
        /* Omitting full CSS for brevity, assuming it's appended here */
        #jobscans-sidebar { position: fixed; top: 20px; right: -400px; width: 350px; max-height: calc(100vh - 40px); background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 9999999; font-family: 'Inter', sans-serif; color: #1e293b; transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); display: flex; flex-direction: column; }
        #jobscans-sidebar.visible { right: 20px; }
        #jobscans-sidebar-content { padding: 20px; overflow-y: auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
        .header h3 { font-size: 20px; font-weight: 700; margin: 0; }
        .logo-span { color: #4f46e5; }
        #jobscans-close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #94a3b8; padding: 0; line-height: 1; }
        .job-info h4 { font-size: 18px; font-weight: 600; margin: 0 0 4px 0; }
        .job-info p { font-size: 14px; color: #64748b; margin: 0; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
        .analysis-section h5, .toolkit-section h6, .community-alert h5 { font-size: 16px; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; }
        .analysis-list { list-style: none; padding: 12px; margin: 0; font-size: 14px; color: #854d0e; background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px; }
        .analysis-list li { margin-bottom: 8px; }
        .toolkit-section { margin-bottom: 16px; }
        .toolkit-desc { font-size: 13px; color: #64748b; margin: 4px 0 8px 0; }
        .toolkit-desc.tone { font-style: italic; background-color: #f1f5f9; padding: 8px; border-radius: 6px; }
        .outreach-keywords { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .keyword-item { font-size: 12px; padding: 4px 10px; border-radius: 16px; font-weight: 500; }
        .keyword-item.hard { background-color: #e0e7ff; color: #3730a3; }
        .keyword-item.soft { background-color: #dcfce7; color: #166534; }
        .research-links { list-style: none; padding: 0; margin: 0; }
        .research-links a { font-size: 14px; color: #4f46e5; text-decoration: none; }
        .research-links a:hover { text-decoration: underline; }
        .actions { margin-top: 20px; }
        #flag-job-btn { width: 100%; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        #flag-job-btn:hover { background-color: #fca5a5; }
        .community-alert { background-color: #fffbeb; border: 1px solid #facc15; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
        #jobscans-flag-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000000; display: flex; align-items: center; justify-content: center; }
        .modal-content { background: white; padding: 24px; border-radius: 12px; width: 450px; max-width: 90%; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .modal-content h4 { margin-top: 0; }
        .modal-content p { font-size: 14px; color: #475569; }
        .modal-content select, .modal-content textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; margin-top: 12px; }
        .modal-content textarea { resize: vertical; min-height: 80px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .modal-actions button { padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; }
        #cancel-flag-btn { background-color: #e2e8f0; }
        #submit-flag-btn { background-color: #4f46e5; color: white; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.id = 'jobscans-styles';
    if (!document.getElementById('jobscans-styles')) {
      element.appendChild(styleSheet);
      styleSheet.innerText = styles;
    }
}

// --- Entry Point ---
const observer = new MutationObserver((mutations, obs) => {
    const targetElement = document.querySelector('.jobs-unified-top-card__job-title, .top-card-layout__title');
    if (targetElement) {
        if (!document.getElementById('jobscans-sidebar')) {
            analyzeJobPosting();
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });
