document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const resultSection = document.getElementById('resultSection');
    
    const locationInfo = document.getElementById('locationInfo');
    const networkInfo = document.getElementById('networkInfo');
    const ispInfo = document.getElementById('ispInfo');
    const typeInfo = document.getElementById('typeInfo');

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

    // MAC Address Database (simplified for demo purposes)
    const macDatabase = {
        '00:1A:11': { manufacturer: 'Google, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2010-05-07' },
        '00:1B:44': { manufacturer: 'SanDisk Corporation', type: 'Storage Device', assignment: 'Individual (UAA)', date: '2008-03-12' },
        '00:14:22': { manufacturer: 'Dell Inc.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2007-01-14' },
        '00:1A:22': { manufacturer: 'Cisco Systems, Inc.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2009-08-23' },
        '00:17:88': { manufacturer: 'Philips Lighting B.V.', type: 'Smart Home Device', assignment: 'Individual (UAA)', date: '2012-11-30' },
        '00:19:B9': { manufacturer: 'Dell Inc.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2008-06-17' },
        '1C:69:7A': { manufacturer: 'EliteGroup Computer Systems Co., Ltd.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2015-02-11' },
        'AC:CF:85': { manufacturer: 'Apple, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2014-09-05' },
        'A4:C3:F0': { manufacturer: 'Intel Corporate', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2016-04-22' },
        '00:26:37': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Consumer Electronics', assignment: 'Individual (UAA)', date: '2011-12-03' }
    };

    // Random MAC address generator
    function generateRandomMAC() {
        const hexDigits = "0123456789ABCDEF";
        let mac = "";
        
        for (let i = 0; i < 6; i++) {
            mac += hexDigits.charAt(Math.floor(Math.random() * 16));
            mac += hexDigits.charAt(Math.floor(Math.random() * 16));
            if (i < 5) mac += ":";
        }
        
        return mac;
    }

    // Function to get a prefix from a MAC address
    function getMACPrefix(mac) {
        // Normalize MAC format
        const normalizedMAC = mac.replace(/[^0-9A-F]/gi, '').toUpperCase();
        
        // Format the first 6 characters (OUI) with colons
        if (normalizedMAC.length >= 6) {
            return normalizedMAC.substring(0, 2) + ':' + 
                   normalizedMAC.substring(2, 4) + ':' + 
                   normalizedMAC.substring(4, 6);
        }
        
        return null;
    }

    // Function to fetch and display MAC information
    function fetchMACInfo(macAddress) {
        if (!validateMAC(macAddress)) {
            showToast('Please enter a valid MAC address');
            return;
        }

        // Get the MAC prefix (OUI)
        const prefix = getMACPrefix(macAddress);
        
        // Format the MAC address consistently
        const formattedMAC = formatMAC(macAddress);
        
        // Find a matching entry or use a random one for demo
        let info = null;
        
        for (const dbPrefix in macDatabase) {
            if (prefix.startsWith(dbPrefix.substring(0, 6))) {
                info = macDatabase[dbPrefix];
                break;
            }
        }
        
        // If no match found, use a random entry for demo purposes
        if (!info) {
            const prefixes = Object.keys(macDatabase);
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            info = macDatabase[randomPrefix];
        }

        // Update result cards with MAC information
        locationInfo.innerHTML = `
            <strong>Name:</strong> ${info.manufacturer || 'Unknown'}<br>
            <strong>Country:</strong> United States<br>
            <strong>Address:</strong> Corporate Headquarters
        `;

        networkInfo.innerHTML = `
            <strong>MAC:</strong> ${formattedMAC || 'N/A'}<br>
            <strong>OUI:</strong> ${prefix || 'N/A'}<br>
            <strong>Block Size:</strong> Medium (4096 addresses)<br>
            <strong>Assignment Date:</strong> ${info.date || 'Unknown'}
        `;

        ispInfo.innerHTML = `
            <strong>Category:</strong> ${info.type || 'Unknown'}<br>
            <strong>Protocol:</strong> IEEE 802<br>
            <strong>Registry:</strong> MA-L
        `;

        typeInfo.innerHTML = `
            <strong>Type:</strong> ${info.assignment || 'Unknown'}<br>
            <strong>Status:</strong> Active<br>
            <strong>Updated:</strong> ${new Date().toISOString().split('T')[0]}
        `;

        // Update the visual representation
        updateMACVisualization(formattedMAC, info);
    }

    function updateMACVisualization(mac, info) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = ''; // Clear previous content
        
        // Create a visual representation of the MAC address
        const visualElement = document.createElement('div');
        visualElement.className = 'mac-visualization';
        visualElement.innerHTML = `
            <div class="mac-header">MAC Address Structure: ${mac}</div>
            <div class="mac-diagram">
                <div class="mac-section oui-section">
                    <div class="mac-bytes">${mac.substring(0, 8)}</div>
                    <div class="mac-label">OUI (Manufacturer)</div>
                    <div class="mac-info">${info.manufacturer}</div>
                </div>
                <div class="mac-section nic-section">
                    <div class="mac-bytes">${mac.substring(9)}</div>
                    <div class="mac-label">NIC (Device Specific)</div>
                    <div class="mac-info">Unique Device Identifier</div>
                </div>
            </div>
            <div class="mac-description">
                <p>The first 6 digits (${mac.substring(0, 8)}) identify the manufacturer. The last 6 digits are unique to the specific device.</p>
                <p><strong>Manufacturer:</strong> ${info.manufacturer}</p>
                <p><strong>Device Type:</strong> ${info.type}</p>
                <p><strong>Assignment Type:</strong> ${info.assignment}</p>
            </div>
        `;
        
        mapContainer.appendChild(visualElement);
    }

    // Format MAC address consistently (XX:XX:XX:XX:XX:XX)
    function formatMAC(mac) {
        // Remove all non-hex characters
        const cleanMAC = mac.replace(/[^0-9A-Fa-f]/g, '');
        
        // Format with colons
        if (cleanMAC.length >= 12) {
            let formatted = '';
            for (let i = 0; i < 12; i += 2) {
                formatted += cleanMAC.substring(i, i + 2);
                if (i < 10) formatted += ':';
            }
            return formatted.toUpperCase();
        }
        
        return null;
    }

    // Lookup button event listener
    lookupBtn.addEventListener('click', () => {
        const macAddress = ipInput.value.trim();
        fetchMACInfo(macAddress);
    });

    // Random MAC button event listener (renamed from myIpBtn)
    myIpBtn.addEventListener('click', () => {
        const randomMAC = generateRandomMAC();
        ipInput.value = randomMAC;
        fetchMACInfo(randomMAC);
    });

    function validateMAC(mac) {
        // Allow different formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX
        const cleanMAC = mac.replace(/[^0-9A-Fa-f]/g, '');
        return cleanMAC.length === 12;
    }

    // Add some CSS for the MAC visualization
    const style = document.createElement('style');
    style.textContent = `
        .mac-visualization {
            padding: 20px;
            background-color: var(--bg-primary);
            border-radius: var(--border-radius);
            height: 100%;
        }
        .mac-header {
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 20px;
            text-align: center;
            color: var(--accent-color);
        }
        .mac-diagram {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            gap: 10px;
        }
        .mac-section {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
        }
        .oui-section {
            background: linear-gradient(135deg, #a5b4fc, #818cf8);
            color: white;
        }
        .nic-section {
            background: linear-gradient(135deg, #93c5fd, #60a5fa);
            color: white;
        }
        .mac-bytes {
            font-size: 1.4rem;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .mac-label {
            font-size: 0.9rem;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .mac-info {
            font-weight: 500;
        }
        .mac-description {
            line-height: 1.6;
            color: #4b5563;
        }
        .mac-description p {
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);

    // Replace with empty input on page load
    ipInput.value = "";
});
