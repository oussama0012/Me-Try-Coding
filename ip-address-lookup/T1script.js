document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const resultSection = document.getElementById('resultSection');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    const locationInfo = document.getElementById('locationInfo');
    const networkInfo = document.getElementById('networkInfo');
    const ispInfo = document.getElementById('ispInfo');
    const typeInfo = document.getElementById('typeInfo');

    let map = null;
    let currentIPData = null; // Store current IP data for export

    // Dark mode functionality
    function initDarkMode() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    function toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    // Initialize dark mode
    initDarkMode();

    // Dark mode toggle event listener
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Function to show toast notification
    function showToast(message, type = 'error') {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        // Change color based on type
        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${type === 'success' ? 
                    '<polyline points="20 6 9 17 4 12"></polyline>' : 
                    '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                }
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

    // Function to fetch and display IP information
    async function fetchIPInfo(ipAddress) {
        if (!validateIP(ipAddress)) {
            showToast('Please enter a valid IP address');
            return;
        }

        try {
            const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
            const data = response.data;

            // Store current IP data for export
            currentIPData = data;

            // Better IPv6 detection
            const isIPv6 = ipAddress.includes(':');
            const ipVersion = isIPv6 ? 'IPv6' : 'IPv4';

            // Check for API errors
            if (data.error) {
                showToast(`Error: ${data.reason || 'Unable to lookup IP address'}`);
                return;
            }

            // Update result cards with detailed information
            locationInfo.innerHTML = `
                <strong>City:</strong> ${data.city || 'N/A'}<br>
                <strong>Region:</strong> ${data.region || 'N/A'}<br>
                <strong>Country:</strong> ${data.country_name || 'N/A'}
            `;

            networkInfo.innerHTML = `
                <strong>IP:</strong> ${data.ip || 'N/A'}<br>
                <strong>Network:</strong> ${data.network || 'N/A'}<br>
                <strong>Latitude:</strong> ${data.latitude || 'N/A'}<br>
                <strong>Longitude:</strong> ${data.longitude || 'N/A'}
            `;

            ispInfo.innerHTML = `
                <strong>Organization:</strong> ${data.org || 'N/A'}<br>
                <strong>ASN:</strong> ${data.asn || 'N/A'}<br>
                <strong>Timezone:</strong> ${data.timezone || 'N/A'}
            `;

            typeInfo.innerHTML = `
                <strong>Version:</strong> ${ipVersion}<br>
                <strong>Postal Code:</strong> ${data.postal || 'N/A'}<br>
                <strong>Currency:</strong> ${data.currency_name || 'N/A'}
            `;

            // Initialize or update map
            const mapContainer = document.getElementById('mapContainer');
            mapContainer.innerHTML = ''; // Clear previous map
            
            // Check if latitude and longitude are available
            if (data.latitude && data.longitude) {
                const mapElement = document.createElement('div');
                mapElement.style.width = '100%';
                mapElement.style.height = '350px';
                mapContainer.appendChild(mapElement);

                // Initialize Leaflet map
                map = L.map(mapElement).setView([data.latitude, data.longitude], 10);
                
                // Add tile layer (OpenStreetMap)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: ' OpenStreetMap contributors'
                }).addTo(map);

                // Add marker
                L.marker([data.latitude, data.longitude])
                    .addTo(map)
                    .bindPopup(`Location: ${data.city}, ${data.country_name}`)
                    .openPopup();
            } else {
                mapContainer.innerHTML = '<p>Location information not available</p>';
            }

        } catch (error) {
            console.error('IP Lookup Error:', error);
            showToast('Unable to fetch IP details. Please try again.');
        }
    }

    // Lookup button event listener
    lookupBtn.addEventListener('click', () => {
        const ipAddress = ipInput.value.trim();
        fetchIPInfo(ipAddress);
    });

    // My IP button event listener
    myIpBtn.addEventListener('click', async () => {
        try {
            const response = await axios.get('https://api.ipify.org?format=json');
            const myIP = response.data.ip;
            
            // Set input value and trigger lookup
            ipInput.value = myIP;
            fetchIPInfo(myIP);
        } catch (error) {
            console.error('Failed to fetch IP:', error);
            showToast('Unable to retrieve your IP address. Please try again.');
        }
    });

    function validateIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        
        // Improved IPv6 validation - handles all valid IPv6 formats
        const ipv6Patterns = [
            // Full format: 8 groups of 4 hex digits
            /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
            // Compressed format with :: (various positions)
            /^([0-9a-fA-F]{1,4}:){1,7}:$/,
            /^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/,
            /^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$/,
            /^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$/,
            /^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$/,
            /^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$/,
            /^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$/,
            /^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/,
            // Special cases
            /^::$/,
            /^::1$/,
            /^::ffff:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
        ];
        
        // Check IPv4
        if (ipv4Regex.test(ip)) {
            const parts = ip.split('.');
            return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
        }
        
        // Check IPv6 - test against all patterns
        return ipv6Patterns.some(pattern => pattern.test(ip));
    }

    // Copy functionality
    function setupCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = btn.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const textContent = targetElement.textContent || targetElement.innerText;
                    
                    try {
                        await navigator.clipboard.writeText(textContent);
                        showToast('Copied to clipboard!', 'success');
                    } catch (err) {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textContent;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        showToast('Copied to clipboard!', 'success');
                    }
                }
            });
        });
    }

    // Export functionality
    function setupExportButtons() {
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const exportTxtBtn = document.getElementById('exportTxtBtn');
        const copyAllBtn = document.getElementById('copyAllBtn');

        exportJsonBtn.addEventListener('click', () => {
            if (!currentIPData) {
                showToast('No data to export. Please perform an IP lookup first.');
                return;
            }

            const jsonData = JSON.stringify(currentIPData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ip-lookup-${currentIPData.ip || 'unknown'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('JSON file downloaded!', 'success');
        });

        exportTxtBtn.addEventListener('click', () => {
            if (!currentIPData) {
                showToast('No data to export. Please perform an IP lookup first.');
                return;
            }

            const textData = `IP Address Lookup Results
=============================
IP Address: ${currentIPData.ip || 'N/A'}
City: ${currentIPData.city || 'N/A'}
Region: ${currentIPData.region || 'N/A'}
Country: ${currentIPData.country_name || 'N/A'}
Network: ${currentIPData.network || 'N/A'}
Latitude: ${currentIPData.latitude || 'N/A'}
Longitude: ${currentIPData.longitude || 'N/A'}
Organization: ${currentIPData.org || 'N/A'}
ASN: ${currentIPData.asn || 'N/A'}
Timezone: ${currentIPData.timezone || 'N/A'}
Postal Code: ${currentIPData.postal || 'N/A'}
Currency: ${currentIPData.currency_name || 'N/A'}
Version: ${currentIPData.ip && currentIPData.ip.includes(':') ? 'IPv6' : 'IPv4'}

Generated on: ${new Date().toLocaleString()}`;

            const blob = new Blob([textData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ip-lookup-${currentIPData.ip || 'unknown'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Text file downloaded!', 'success');
        });

        copyAllBtn.addEventListener('click', async () => {
            if (!currentIPData) {
                showToast('No data to copy. Please perform an IP lookup first.');
                return;
            }

            const allText = `IP Address: ${currentIPData.ip || 'N/A'}
City: ${currentIPData.city || 'N/A'}
Region: ${currentIPData.region || 'N/A'}
Country: ${currentIPData.country_name || 'N/A'}
Network: ${currentIPData.network || 'N/A'}
Latitude: ${currentIPData.latitude || 'N/A'}
Longitude: ${currentIPData.longitude || 'N/A'}
Organization: ${currentIPData.org || 'N/A'}
ASN: ${currentIPData.asn || 'N/A'}
Timezone: ${currentIPData.timezone || 'N/A'}
Postal Code: ${currentIPData.postal || 'N/A'}
Currency: ${currentIPData.currency_name || 'N/A'}
Version: ${currentIPData.ip && currentIPData.ip.includes(':') ? 'IPv6' : 'IPv4'}`;

            try {
                await navigator.clipboard.writeText(allText);
                showToast('All results copied to clipboard!', 'success');
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = allText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('All results copied to clipboard!', 'success');
            }
        });
    }

    // Initialize copy and export functionality
    setupCopyButtons();
    setupExportButtons();
});
