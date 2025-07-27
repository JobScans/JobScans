// Import the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

// --- Firebase Config ---
// User's live Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBM8da3uCbBcHZS8E3yrmkRy7P8dQHVtzg",
  authDomain: "jobscans.firebaseapp.com",
  projectId: "jobscans",
  storageBucket: "jobscans.appspot.com",
  messagingSenderId: "179978435562",
  appId: "1:179978435562:web:76b5284493712a6a6f9093",
  measurementId: "G-SLME4X87JC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("JobScans background service worker started and connected to Firebase.");

// Listens for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle flagging a job
    if (message.type === 'FLAG_JOB') {
        console.log("Received job to flag:", message.payload);
        addFlaggedJob(message.payload)
            .then(() => {
                console.log("Successfully flagged job in Firestore.");
                sendResponse({ status: "success" });
            })
            .catch(error => {
                console.error("Error flagging job:", error);
                sendResponse({ status: "error", error: error.message });
            });
        return true; // Indicates that the response is sent asynchronously
    }

    // Handle checking the community archive
    if (message.type === 'CHECK_ARCHIVE') {
        console.log("Checking archive for:", message.payload.title);
        checkForExistingFlag(message.payload)
            .then(existingFlag => {
                sendResponse({ status: "success", payload: existingFlag });
            })
            .catch(error => {
                console.error("Error checking archive:", error);
                sendResponse({ status: "error", error: error.message });
            });
        return true; // Indicates that the response is sent asynchronously
    }
});

/**
 * Adds a new document to the 'flaggedJobs' collection in Firestore.
 * @param {object} jobData - The job data to save.
 */
async function addFlaggedJob(jobData) {
    try {
        const docRef = await addDoc(collection(db, "flaggedJobs"), jobData);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e; // Re-throw the error to be caught by the caller
    }
}

/**
 * Checks if a similar job has already been flagged.
 * @param {object} jobData - The job data to check.
 * @returns {object|null} The existing flag data or null.
 */
async function checkForExistingFlag(jobData) {
    try {
        const q = query(
            collection(db, "flaggedJobs"),
            where("title", "==", jobData.title),
            where("company", "==", jobData.company)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // Return the data of the first match found
            const docData = querySnapshot.docs[0].data();
            console.log("Found existing flag:", docData);
            return docData;
        }
        return null;
    } catch (e) {
        console.error("Error checking for existing flag: ", e);
        return null;
    }
}
