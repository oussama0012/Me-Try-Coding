document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const portInput = document.getElementById('portInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const resultSection = document.getElementById('resultSection');
    
    const hostInfo = document.getElementById('hostInfo');
    const portInfo = document.getElementById('portInfo');
    const statusInfo = document.getElementById('statusInfo');
    const responseInfo = document.getElementById('responseInfo');

    let map = null;

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

    // Function to check if a port is open
    async function checkPort(host, port) {
        if (!validateInput(host)) {
            showToast('Please enter a valid IP address or domain name');
            return;
        }

        if (!validatePort(port)) {
            showToast('Please enter a valid port number (1-65535)');
            return;
        }

        try {
            // Show checking status
            hostInfo.innerHTML = `<strong>Host:</strong> ${host}`;
            portInfo.innerHTML = `<strong>Port:</strong> ${port}`;
            statusInfo.innerHTML = `<strong>Status:</strong> <span class="checking">Checking...</span>`;
            responseInfo.innerHTML = `<strong>Response Time:</strong> Measuring...`;

            const startTime = new Date().getTime();
            
            // In a real application, this would be a server-side check
            // For demo purposes, we're simulating a port check
            const response = await simulatePortCheck(host, port);
            
            const endTime = new Date().getTime();
            const responseTime = endTime - startTime;

            // Update result cards with port check information
            hostInfo.innerHTML = `
                <strong>Host:</strong> ${host}<br>
                <strong>Resolved IP:</strong> ${response.ip || 'N/A'}<br>
                <strong>Service:</strong> ${getServiceName(port) || 'Unknown'}
            `;

            portInfo.innerHTML = `
                <strong>Port:</strong> ${port}<br>
                <strong>Protocol:</strong> ${getProtocol(port)}<br>
                <strong>Common Use:</strong> ${getServiceDescription(port) || 'Custom Service'}
            `;

            if (response.isOpen) {
                statusInfo.innerHTML = `
                    <strong>Status:</strong> <span class="port-open">OPEN</span><br>
                    <strong>Details:</strong> Port is accepting connections<br>
                    <strong>Security:</strong> ${getSecurityAdvice(port)}
                `;
            } else {
                statusInfo.innerHTML = `
                    <strong>Status:</strong> <span class="port-closed">CLOSED</span><br>
                    <strong>Details:</strong> Port is not responding<br>
                    <strong>Possible Causes:</strong> Firewall, service not running
                `;
            }

            responseInfo.innerHTML = `
                <strong>Response Time:</strong> ${responseTime}ms<br>
                <strong>Tested:</strong> ${new Date().toLocaleString()}<br>
                <strong>Method:</strong> TCP Connection
            `;

        } catch (error) {
            console.error('Port Check Error:', error);
            showToast('Unable to check port. Please try again.');
            
            // Update with error information
            statusInfo.innerHTML = `<strong>Status:</strong> <span class="port-error">ERROR</span>`;
            responseInfo.innerHTML = `<strong>Response Time:</strong> N/A<br><strong>Error:</strong> ${error.message}`;
        }
    }

    // This is a simulation since browser-based JS can't actually check ports directly
    // In a real app, this would call a backend service
    async function simulatePortCheck(host, port) {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                // Define common open ports with their associated hosts
                const commonOpenPorts = {
                    '80': ['google.com', 'facebook.com', 'amazon.com', 'github.com'],
                    '443': ['google.com', 'facebook.com', 'amazon.com', 'github.com', 'youtube.com', 'netflix.com', 'microsoft.com'],
                    '22': ['github.com'],
                    '21': [],
                    '25': [],
                    '3306': []
                };
                
                // For domains, check if they are in our list of known open ports
                let isOpen = false;
                
                if (isValidDomain(host)) {
                    isOpen = commonOpenPorts[port] && commonOpenPorts[port].includes(host);
                } else {
                    // For IPs, simulate more realistic behavior
                    // Common ports that might be open on random servers
                    isOpen = ['80', '443'].includes(port) && Math.random() > 0.7;
                }
                
                resolve({
                    isOpen: isOpen,
                    ip: isValidDomain(host) ? generateRandomIP() : host
                });
            }, 1500); // Simulate network delay
        });
    }

    function generateRandomIP() {
        return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    }

    // Function to get service name from port number
    function getServiceName(port) {
        const services = {
            '21': 'FTP',
            '22': 'SSH',
            '23': 'Telnet',
            '25': 'SMTP',
            '53': 'DNS',
            '80': 'HTTP',
            '110': 'POP3',
            '143': 'IMAP',
            '443': 'HTTPS',
            '3306': 'MySQL',
            '3389': 'RDP',
            '5432': 'PostgreSQL'
        };
        return services[port] || null;
    }

    // Function to get protocol from port number
    function getProtocol(port) {
        return port == 443 ? 'HTTPS/TCP' : 'TCP';
    }

    // Function to get service description
    function getServiceDescription(port) {
        const descriptions = {
            '21': 'File Transfer',
            '22': 'Secure Shell Access',
            '23': 'Remote Terminal Access',
            '25': 'Email Sending',
            '53': 'Domain Name Resolution',
            '80': 'Web Traffic',
            '110': 'Email Receiving',
            '143': 'Email Management',
            '443': 'Secure Web Traffic',
            '3306': 'Database Access',
            '3389': 'Remote Desktop',
            '5432': 'Database Access'
        };
        return descriptions[port] || null;
    }

    // Function to get security advice
    function getSecurityAdvice(port) {
        const securityAdvice = {
            '21': 'Consider using SFTP instead',
            '22': 'Use key authentication only',
            '23': 'Insecure, consider alternatives',
            '80': 'Consider using HTTPS (443)',
            '3389': 'Limit access with firewall'
        };
        return securityAdvice[port] || 'Verify if needed';
    }

    // Lookup button event listener
    lookupBtn.addEventListener('click', () => {
        const host = ipInput.value.trim();
        const port = portInput.value.trim();
        checkPort(host, port);
    });

    // My IP button event listener
    myIpBtn.addEventListener('click', async () => {
        try {
            const response = await axios.get('https://api.ipify.org?format=json');
            const myIP = response.data.ip;
            
            // Set input value
            ipInput.value = myIP;
            
            // Focus on port input if empty
            if (!portInput.value) {
                portInput.focus();
            }
        } catch (error) {
            console.error('Failed to fetch IP:', error);
            showToast('Unable to retrieve your IP address. Please try again.');
        }
    });

    // Helper functions for validation
    function validateInput(input) {
        return isValidIP(input) || isValidDomain(input);
    }

    function isValidIP(ip) {
        // IP address validation regex pattern
        const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipPattern.test(ip);
    }

    function isValidDomain(domain) {
        // Domain validation regex pattern
        const domainPattern = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;
        return domainPattern.test(domain);
    }

    function validatePort(port) {
        const portNum = parseInt(port);
        return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
    }

    // Add event listener for port input field to accept Enter key
    portInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            lookupBtn.click();
        }
    });

    // Add click event listeners to common port references
    document.querySelectorAll('.port-item').forEach(item => {
        item.addEventListener('click', () => {
            const port = item.querySelector('span').textContent;
            portInput.value = port;
        });
    });
});
