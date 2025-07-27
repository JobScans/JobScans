import React, { useState, useEffect } from 'react';
import { Download, BookOpen, DollarSign, HelpCircle, Github, Menu, X, ShieldAlert, Users, FileSearch } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';

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


// Main App Component - Acts as a router
export default function App() {
  const [page, setPage] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigateTo = (newPage) => {
    setPage(newPage);
    setIsMenuOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'about':
        return <AboutPage />;
      case 'archive':
        return <ArchivePage />;
      case 'donate':
        return <DonatePage />;
      case 'faq':
        return <FAQPage />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  const navLinks = [
    { id: 'home', text: 'Home', icon: null },
    { id: 'about', text: 'About', icon: <BookOpen size={18} /> },
    { id: 'archive', text: 'Flagged Jobs', icon: <ShieldAlert size={18} /> },
    { id: 'donate', text: 'Donate', icon: <DollarSign size={18} /> },
    { id: 'faq', text: 'FAQ', icon: <HelpCircle size={18} /> },
  ];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900 cursor-pointer" onClick={() => navigateTo('home')}>
            Job<span className="text-indigo-600">Scans</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => navigateTo(link.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  page === link.id
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.text}
              </button>
            ))}
          </div>
          <div className="hidden md:flex">
             <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 flex items-center space-x-2">
                <Download size={16} />
                <span>Get Extension</span>
            </button>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-slate-900">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id)}
                  className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    page === link.id
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.icon}
                  <span>{link.text}</span>
                </button>
              ))}
              <div className="pt-4 px-3">
                <button className="bg-indigo-600 text-white w-full block text-center px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 flex items-center justify-center space-x-2">
                    <Download size={16} />
                    <span>Get Extension</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="font-semibold text-slate-900">Job<span className="text-indigo-600">Scans</span></p>
              <p className="text-sm text-slate-500 mt-1">A community shield for a safer job search.</p>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} JobScans. All rights reserved.</p>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-600">
                <Github size={24} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Home Page Component
const HomePage = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-6 py-16 md:py-24 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
          A Smarter, Safer Job Search. <span className="text-indigo-600">Together.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
          JobScans is a free browser extension that helps you analyze job postings and anonymously flag suspicious listings to protect the community.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg">
            <Download size={20} />
            <span>Download for Chrome</span>
          </button>
          <button className="w-full sm:w-auto bg-slate-200 text-slate-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-300 transition-transform transform hover:scale-105 flex items-center justify-center space-x-2">
            <span>Download for Firefox</span>
          </button>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="mt-24 md:mt-32">
        <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<FileSearch className="text-indigo-600" size={32} />}
            title="Analyze Job Postings"
            description="Our extension helps you identify common red flags and inconsistencies in job listings as you browse."
          />
          <FeatureCard
            icon={<ShieldAlert className="text-indigo-600" size={32} />}
            title="Flag Suspicious Jobs"
            description="Found a 'ghost job' or a listing with red flags? Anonymously flag it with one click to warn other job seekers."
          />
          <FeatureCard
            icon={<Users className="text-indigo-600" size={32} />}
            title="Consult the Community Archive"
            description="Check our public archive of flagged jobs before you apply. Save time and avoid scams by learning from others."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-left">
    <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);


// About Page
const AboutPage = () => (
  <div className="container mx-auto px-6 py-16">
    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-sm border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">About JobScans</h1>
      <div className="prose prose-lg text-slate-600 max-w-none">
        <p>JobScans was born from a simple idea: job seekers deserve tools that empower them with clarity and protect them from deceptive practices.</p>
        <p>Our mission is to build a shared, community-driven shield against the frustrating and harmful side of the hiring world. By working together, we can make the job search safer for everyone.</p>
        <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-2">Our Philosophy</h3>
        <ul>
          <li><strong>Anonymous by Design:</strong> When you flag a job, your submission is completely anonymous. We don't know who you are, and we never track your personal activity.</li>
          <li><strong>Community-Powered:</strong> The strength of JobScans comes from its users. Every flagged job adds to a public archive that helps the entire community avoid scams and time-wasting listings.</li>
          <li><strong>Empowerment Through Information:</strong> We give you the ability to spot red flags and the power to share that knowledge, helping others in their search.</li>
        </ul>
        <p>This is a commitment to building honest, useful software. We hope it helps.</p>
      </div>
    </div>
  </div>
);

// Archive Page - Now a community feed
const ArchivePage = () => {
    const [flaggedJobs, setFlaggedJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "flaggedJobs"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const jobs = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure flaggedAt is a Date object
            const flaggedAtDate = data.flaggedAt?.toDate ? data.flaggedAt.toDate() : new Date(data.flaggedAt);
            jobs.push({ id: doc.id, ...data, flaggedAt: flaggedAtDate });
          });
          // Sort by date descending
          jobs.sort((a, b) => b.flaggedAt - a.flaggedAt);
          setFlaggedJobs(jobs);
          setIsLoading(false);
        }, (error) => {
            console.error("Error fetching flagged jobs: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto px-6 py-16">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <ShieldAlert size={48} className="mx-auto text-amber-500 mb-4" />
                    <h1 className="text-3xl font-bold text-slate-900">Community-Flagged Jobs</h1>
                    <p className="mt-4 text-lg text-slate-600">This is a public archive of jobs flagged as suspicious by the JobScans community. Review these before you apply.</p>
                </div>

                {isLoading ? (
                    <div className="text-center text-slate-500">
                        <p>Loading flagged jobs...</p>
                    </div>
                ) : flaggedJobs.length === 0 ? (
                    <div className="text-center bg-white p-10 rounded-lg shadow-sm border">
                        <h3 className="text-xl font-semibold text-slate-700">Archive is Clear!</h3>
                        <p className="text-slate-500 mt-2">No jobs have been flagged by the community yet. Be the first to help out!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {flaggedJobs.map(job => (
                            <FlaggedJobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const FlaggedJobCard = ({ job }) => {
    const timeAgo = (date) => {
        if (!date) return 'a while ago';
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
                    <p className="text-md text-slate-600 mt-1">{job.company} - {job.location}</p>
                </div>
                <div className="text-sm text-slate-500 mt-2 sm:mt-0 sm:text-right">
                    Flagged {timeAgo(job.flaggedAt)}
                </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md">
                <p><span className="font-semibold">Reason for flag:</span> {job.reason}</p>
            </div>
        </div>
    )
}

// Donate Page
const DonatePage = () => (
  <div className="container mx-auto px-6 py-16 text-center">
    <div className="max-w-2xl mx-auto">
      <DollarSign size={48} className="mx-auto text-slate-400 mb-4" />
      <h1 className="text-3xl font-bold text-slate-900">Support JobScans</h1>
      <p className="mt-4 text-lg text-slate-600">JobScans is a free, open-source project. We are committed to keeping it free of ads and personal tracking.</p>
      <p className="mt-4 text-lg text-slate-600">If you find this tool valuable, please consider making a small donation to help cover server costs for the community archive and support future development.</p>
      <div className="mt-8">
        <button className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors">
          Donate via Ko-fi (Coming Soon)
        </button>
      </div>
    </div>
  </div>
);

// FAQ Page
const FAQPage = () => (
  <div className="container mx-auto px-6 py-16">
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h1>
      <div className="space-y-6">
        <FAQItem
          question="Do you track me or collect my personal data?"
          answer="No. We do not track your browsing history, search activity, or any other personal information. The only data we store is completely anonymous information about job postings that you explicitly choose to flag for the community's benefit. We never know who you are."
        />
        <FAQItem
          question="How is my privacy protected when I flag a job?"
          answer="The data sent to our public archive is completely anonymous. There is no account, no user ID, no IP address, and no personal information linked to the submission. It's like putting an anonymous note on a public bulletin board."
        />
        <FAQItem
          question="Which job sites are supported?"
          answer="Initially, we are targeting major job boards like LinkedIn and Indeed. We plan to expand support to more sites based on user feedback. The tool is designed to be adaptable."
        />
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <button
        className="w-full flex justify-between items-center text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-slate-800">{question}</h3>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 text-slate-600">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};
