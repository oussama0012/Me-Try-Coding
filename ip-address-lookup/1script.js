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

    // Function to get country flag emoji from country code or name
    function getCountryFlag(countryName, countryCode) {
        // Removed flag functionality due to browser compatibility issues
        return '';
    }

    // Function to fetch and display IP information
    async function fetchIPInfo(ipAddress) {
        if (!validateIP(ipAddress)) {
            showToast('Please enter a valid IP address');
            return;
        }

        try {
            // Try ipwhois.io first
            let response;
            let data;
            let isIPWhoisAPI = true;

            try {
                response = await axios.get(`https://ipwhois.app/json/${ipAddress}`);
                data = response.data;
                
                // Check if ipwhois.io returned an error (rate limit or other)
                if (!data.success) {
                    throw new Error('ipwhois.io limit reached or error');
                }
            } catch (ipwhoisError) {
                console.log('ipwhois.io failed, trying IP-API fallback:', ipwhoisError.message);
                // Fallback to IP-API
                response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
                data = response.data;
                isIPWhoisAPI = false;

                // Check for IP-API errors
                if (data.error) {
                    showToast(`Error: ${data.reason || 'Unable to lookup IP address'}`);
                    return;
                }
            }

            // Store current IP data for export
            currentIPData = data;

            // Better IPv6 detection
            const isIPv6 = ipAddress.includes(':');
            const ipVersion = isIPv6 ? 'IPv6' : 'IPv4';

            // Update result cards with detailed information based on API source
            if (isIPWhoisAPI) {
                // ipwhois.io format
                locationInfo.innerHTML = `
                    <strong>City:</strong> ${data.city || 'N/A'}<br>
                    <strong>Region:</strong> ${data.region || 'N/A'}<br>
                    <strong>Country:</strong> ${data.country || 'N/A'}
                `;

                // Better network display with fallback CIDR calculation
                let networkDisplay;
                if (data.cidr) {
                    networkDisplay = `${data.ip || 'N/A'}/${data.cidr}`;
                } else {
                    // Fallback: assume /24 for IPv4 or /64 for IPv6 if no CIDR provided
                    const isIPv6 = (data.ip || '').includes(':');
                    const defaultCidr = isIPv6 ? '64' : '24';
                    networkDisplay = `${data.ip || 'N/A'}/${defaultCidr}`;
                }
                
                networkInfo.innerHTML = `
                    <strong>IP:</strong> ${data.ip || 'N/A'}<br>
                    <strong>Network:</strong> ${networkDisplay}<br>
                    <strong>Latitude:</strong> ${data.latitude || 'N/A'}<br>
                    <strong>Longitude:</strong> ${data.longitude || 'N/A'}
                `;

                ispInfo.innerHTML = `
                    <strong>Organization:</strong> ${data.org || 'N/A'}<br>
                    <strong>ASN:</strong> ${data.asn || 'N/A'}<br>
                    <strong>Timezone:</strong> ${data.timezone_name || 'N/A'}
                `;

                // Only show reliable IP type information
                let typeContent = `<strong>Version:</strong> ${ipVersion}<br>`;
                
                // Add organization type if available and meaningful
                if (data.org) {
                    const org = data.org.toLowerCase();
                    let orgType = 'Commercial';
                    
                    if (org.includes('university') || org.includes('education') || org.includes('school') || org.includes('college')) {
                        orgType = 'Educational';
                    } else if (org.includes('government') || org.includes('military') || org.includes('gov.') || org.includes('.gov')) {
                        orgType = 'Government';
                    } else if (org.includes('hosting') || org.includes('datacenter') || org.includes('cloud') || org.includes('server')) {
                        orgType = 'Hosting/Datacenter';
                    } else if (org.includes('telecom') || org.includes('mobile') || org.includes('wireless') || org.includes('cellular')) {
                        orgType = 'Telecommunications';
                    } else if (org.includes('isp') || org.includes('internet') || org.includes('broadband')) {
                        orgType = 'Internet Service Provider';
                    }
                    
                    typeContent += `<strong>Organization Type:</strong> ${orgType}<br>`;
                }
                
                // Add connection type based on ASN or organization info
                if (data.asn && data.org) {
                    const org = data.org.toLowerCase();
                    let connectionType = 'Broadband';
                    
                    if (org.includes('mobile') || org.includes('cellular') || org.includes('wireless')) {
                        connectionType = 'Mobile/Cellular';
                    } else if (org.includes('cable') || org.includes('fiber') || org.includes('dsl')) {
                        connectionType = 'Fixed Broadband';
                    } else if (org.includes('satellite')) {
                        connectionType = 'Satellite';
                    } else if (org.includes('hosting') || org.includes('datacenter') || org.includes('cloud')) {
                        connectionType = 'Datacenter';
                    }
                    
                    typeContent += `<strong>Connection Type:</strong> ${connectionType}<br>`;
                }
                
                // Only show proxy status if it's explicitly true, otherwise don't show unreliable data
                if (data.is_proxy === true) {
                    typeContent += `<strong>Proxy/VPN:</strong> Detected<br>`;
                }
                
                // Add security classification based on organization
                if (data.org) {
                    const org = data.org.toLowerCase();
                    let securityLevel = 'Standard';
                    
                    if (org.includes('tor') || org.includes('proxy') || org.includes('vpn') || org.includes('anonymous')) {
                        securityLevel = 'Anonymous/Proxy';
                    } else if (org.includes('hosting') || org.includes('datacenter') || org.includes('cloud')) {
                        securityLevel = 'Hosting/Cloud';
                    } else if (org.includes('government') || org.includes('military') || org.includes('defense')) {
                        securityLevel = 'Government';
                    } else if (org.includes('university') || org.includes('education')) {
                        securityLevel = 'Educational';
                    }
                    
                    if (securityLevel !== 'Standard') {
                        typeContent += `<strong>Classification:</strong> ${securityLevel}`;
                    }
                }

                typeInfo.innerHTML = typeContent;
            } else {
                // IP-API format (fallback)
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

                // Only show reliable information for IP-API as well
                let typeContent = `<strong>Version:</strong> ${ipVersion}<br>`;
                
                // Add organization type if available and meaningful
                if (data.org) {
                    const org = data.org.toLowerCase();
                    let orgType = 'Commercial';
                    
                    if (org.includes('university') || org.includes('education') || org.includes('school') || org.includes('college')) {
                        orgType = 'Educational';
                    } else if (org.includes('government') || org.includes('military') || org.includes('gov.') || org.includes('.gov')) {
                        orgType = 'Government';
                    } else if (org.includes('hosting') || org.includes('datacenter') || org.includes('cloud') || org.includes('server')) {
                        orgType = 'Hosting/Datacenter';
                    } else if (org.includes('telecom') || org.includes('mobile') || org.includes('wireless') || org.includes('cellular')) {
                        orgType = 'Telecommunications';
                    } else if (org.includes('isp') || org.includes('internet') || org.includes('broadband')) {
                        orgType = 'Internet Service Provider';
                    }
                    
                    typeContent += `<strong>Organization Type:</strong> ${orgType}<br>`;
                }
                
                // Add connection type based on ASN or organization info
                if (data.asn && data.org) {
                    const org = data.org.toLowerCase();
                    let connectionType = 'Broadband';
                    
                    if (org.includes('mobile') || org.includes('cellular') || org.includes('wireless')) {
                        connectionType = 'Mobile/Cellular';
                    } else if (org.includes('cable') || org.includes('fiber') || org.includes('dsl')) {
                        connectionType = 'Fixed Broadband';
                    } else if (org.includes('satellite')) {
                        connectionType = 'Satellite';
                    } else if (org.includes('hosting') || org.includes('datacenter') || org.includes('cloud')) {
                        connectionType = 'Datacenter';
                    }
                    
                    typeContent += `<strong>Connection Type:</strong> ${connectionType}<br>`;
                }
                
                if (typeof data.mobile === 'boolean') {
                    typeContent += `<strong>Mobile Network:</strong> ${data.mobile ? 'Yes' : 'No'}<br>`;
                }
                
                if (typeof data.proxy === 'boolean' && data.proxy === true) {
                    typeContent += `<strong>Proxy/VPN:</strong> Detected<br>`;
                }
                
                // Add security classification based on organization
                if (data.org) {
                    const org = data.org.toLowerCase();
                    let securityLevel = 'Standard';
                    
                    if (org.includes('tor') || org.includes('proxy') || org.includes('vpn') || org.includes('anonymous')) {
                        securityLevel = 'Anonymous/Proxy';
                    } else if (org.includes('hosting') || org.includes('datacenter') || org.includes('cloud')) {
                        securityLevel = 'Hosting/Cloud';
                    } else if (org.includes('government') || org.includes('military') || org.includes('defense')) {
                        securityLevel = 'Government';
                    } else if (org.includes('university') || org.includes('education')) {
                        securityLevel = 'Educational';
                    }
                    
                    if (securityLevel !== 'Standard') {
                        typeContent += `<strong>Classification:</strong> ${securityLevel}`;
                    }
                }

                typeInfo.innerHTML = typeContent;
            }

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
                const cityName = isIPWhoisAPI ? data.city : data.city;
                const countryName = isIPWhoisAPI ? data.country : data.country_name;
                L.marker([data.latitude, data.longitude])
                    .addTo(map)
                    .bindPopup(`Location: ${cityName}, ${countryName}`)
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

            // Create a copy of the data without the country_flag field
            const filteredData = { ...currentIPData };
            delete filteredData.country_flag;

            const jsonData = JSON.stringify(filteredData, null, 2);
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

            // Determine data format based on available fields
            const isIPWhoisFormat = currentIPData.hasOwnProperty('success');
            
            const textData = `IP Address Lookup Results
=============================

Basic Information:
IP Address: ${currentIPData.ip || 'N/A'}
Version: ${currentIPData.ip && currentIPData.ip.includes(':') ? 'IPv6' : 'IPv4'}

Geographic Location:
City: ${currentIPData.city || 'N/A'}
Region: ${currentIPData.region || 'N/A'}
Country: ${isIPWhoisFormat ? (currentIPData.country || 'N/A') : (currentIPData.country_name || 'N/A')}
Latitude: ${currentIPData.latitude || 'N/A'}
Longitude: ${currentIPData.longitude || 'N/A'}
Timezone: ${isIPWhoisFormat ? (currentIPData.timezone_name || 'N/A') : (currentIPData.timezone || 'N/A')}

Network Information:
Network Range: ${isIPWhoisFormat ? `${currentIPData.ip || 'N/A'}/${currentIPData.cidr || 'N/A'}` : (currentIPData.network || 'N/A')}
Organization: ${currentIPData.org || 'N/A'}
ASN: ${currentIPData.asn || 'N/A'}

=============================
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

            // Get the actual displayed content from the result cards
            const locationText = document.getElementById('locationInfo').textContent || '';
            const networkText = document.getElementById('networkInfo').textContent || '';
            const ispText = document.getElementById('ispInfo').textContent || '';
            const typeText = document.getElementById('typeInfo').textContent || '';

            const allText = `Location Information:
${locationText.trim()}

Network Information:
${networkText.trim()}

ISP Information:
${ispText.trim()}

IP Type Information:
${typeText.trim()}`;

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
