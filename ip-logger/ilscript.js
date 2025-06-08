document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const createLoggerBtn = document.getElementById('createLoggerBtn');
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    const resultSection = document.getElementById('resultSection');
    
    const trackingLinkInfo = document.getElementById('trackingLinkInfo');
    const visitsInfo = document.getElementById('visitsInfo');
    const dashboardInfo = document.getElementById('dashboardInfo');
    const statusInfo = document.getElementById('statusInfo');
    const visitorLogs = document.getElementById('visitorLogs');

    let currentTrackingId = null;
    let logsData = [];

    // Function to show toast notification
    function showToast(message) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Function to validate URL
    function validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Function to generate random tracking ID
    function generateTrackingId() {
        return 'trk_' + Math.random().toString(36).substring(2, 10);
    }

    // Function to create tracking link
    function createTrackingLink(url) {
        if (!validateURL(url)) {
            showToast('Please enter a valid URL (including http:// or https://)');
            return;
        }

        // Generate tracking ID but don't create or display tracking URL
        const trackingId = generateTrackingId();
        
        visitsInfo.textContent = '0';
        statusInfo.textContent = 'Active';
        statusInfo.style.color = '#10b981';
        
        // Clear logs display
        visitorLogs.innerHTML = '<p class="no-logs">No logs yet. The logger is now active and will record visits.</p>';
        
        // Store tracking ID for this session
        currentTrackingId = trackingId;
        logsData = [];
        
        // For demo purposes, simulate some logs after a delay
        setTimeout(() => {
            simulateVisitorLogs();
        }, 2000);
    }

    // Function to simulate visitor logs (for demo purposes)
    function simulateVisitorLogs() {
        // Clear existing logs
        visitorLogs.innerHTML = '';
        
        // Create sample log data
        const sampleLocations = ['New York, US', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia', 'Paris, France'];
        const sampleBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
        const sampleOS = ['Windows 10', 'macOS', 'iOS', 'Android', 'Linux'];
        
        // Generate 3-5 random logs
        const logCount = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < logCount; i++) {
            // Generate random IP
            const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            
            // Random location, browser, OS
            const location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
            const browser = sampleBrowsers[Math.floor(Math.random() * sampleBrowsers.length)];
            const os = sampleOS[Math.floor(Math.random() * sampleOS.length)];
            
            // Random time in the last 24 hours
            const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
            const timestamp = new Date(Date.now() - timeOffset);
            const timeString = timestamp.toLocaleString();
            
            // Create log entry
            const logEntry = {
                ip,
                location,
                browser,
                os,
                time: timeString,
                referrer: 'Direct Link',
                device: Math.random() > 0.5 ? 'Mobile' : 'Desktop'
            };
            
            // Add to logs data
            logsData.push(logEntry);
            
            // Create log entry HTML
            addLogEntryToUI(logEntry);
        }
        
        // Update visit count
        visitsInfo.textContent = logsData.length.toString();
    }

    // Function to add a log entry to the UI
    function addLogEntryToUI(logEntry) {
        const logElement = document.createElement('div');
        logElement.className = 'log-entry';
        
        logElement.innerHTML = `
            <div class="log-time">${logEntry.time}</div>
            <div class="log-ip">${logEntry.ip}</div>
            <div class="log-details">
                <div class="detail-item">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">${logEntry.location}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Browser</span>
                    <span class="detail-value">${logEntry.browser}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Device</span>
                    <span class="detail-value">${logEntry.device}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">OS</span>
                    <span class="detail-value">${logEntry.os}</span>
                </div>
            </div>
        `;
        
        visitorLogs.appendChild(logElement);
    }

    // Create Logger button event listener
    createLoggerBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        createTrackingLink(url);
    });

    // Generate Link button event listener (for demo links)
    generateLinkBtn.addEventListener('click', () => {
        const demoUrls = [
            'https://example.com',
            'https://google.com',
            'https://facebook.com',
            'https://twitter.com',
            'https://instagram.com'
        ];
        
        // Pick a random demo URL
        const randomUrl = demoUrls[Math.floor(Math.random() * demoUrls.length)];
        urlInput.value = randomUrl;
        createTrackingLink(randomUrl);
    });

    // Add clipboard copy function
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Information copied to clipboard!');
        }).catch(err => {
            showToast('Failed to copy. Please try again.');
            console.error('Could not copy text: ', err);
        });
    };
    
    // Add dashboard view function (just a demo)
    window.viewDashboard = function(trackingId) {
        showToast(`Dashboard for tracking ID: ${trackingId}`);
    };
});
