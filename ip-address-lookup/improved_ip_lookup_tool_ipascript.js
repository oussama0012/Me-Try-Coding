document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const resultSection = document.getElementById('resultSection');
    
    const locationInfo = document.getElementById('locationInfo');
    const networkInfo = document.getElementById('networkInfo');
    const ispInfo = document.getElementById('ispInfo');
    const typeInfo = document.getElementById('typeInfo');

    // Copy buttons
    const copyLocation = document.getElementById('copyLocation');
    const copyNetwork = document.getElementById('copyNetwork');
    const copyISP = document.getElementById('copyISP');
    const copyTechnical = document.getElementById('copyTechnical');

    let map = null;
    let currentIPData = null;

    // Dark mode functionality
    function initDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            updateDarkModeIcon(true);
        }
    }

    function toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        updateDarkModeIcon(isDarkMode);
        showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
    }

    function updateDarkModeIcon(isDarkMode) {
        const sunIcon = darkModeToggle.querySelector('.sun-icon');
        const moonIcon = darkModeToggle.querySelector('.moon-icon');
        if (isDarkMode) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // Enhanced toast notification system
    function showToast(message, type = 'error') {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        const icon = type === 'success' ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4"></path>
                <circle cx="12" cy="12" r="10"></circle>
            </svg>` :
            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>`;
        
        toast.innerHTML = `${icon}${message}`;
        
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

    // Enhanced IP validation supporting both IPv4 and IPv6
    function validateIP(ip) {
        // IPv4 validation
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
        
        // IPv6 validation (more comprehensive)
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }

    // Enhanced loading state management
    function setLoadingState(isLoading) {
        const btnContent = lookupBtn.querySelector('.btn-content');
        const loadingSpinner = lookupBtn.querySelector('.loading-spinner');
        
        if (isLoading) {
            btnContent.style.display = 'none';
            loadingSpinner.style.display = 'flex';
            lookupBtn.disabled = true;
            myIpBtn.disabled = true;
            refreshBtn.disabled = true;
        } else {
            btnContent.style.display = 'flex';
            loadingSpinner.style.display = 'none';
            lookupBtn.disabled = false;
            myIpBtn.disabled = false;
            refreshBtn.disabled = false;
        }
    }

    // Enhanced IP information fetching with better error handling
    async function fetchIPInfo(ipAddress) {
        if (!ipAddress) {
            showToast('Please enter an IP address or click "Use My IP"');
            return;
        }

        if (!validateIP(ipAddress)) {
            showToast('Please enter a valid IPv4 or IPv6 address');
            return;
        }

        setLoadingState(true);

        try {
            // Try primary API
            let response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
            let data = response.data;

            // Check if we got an error from the API
            if (data.error) {
                throw new Error(data.reason || 'IP lookup failed');
            }

            // If primary API fails, try backup API for some data
            if (!data.city && !data.country_name) {
                try {
                    const backupResponse = await axios.get(`http://ip-api.com/json/${ipAddress}`);
                    const backupData = backupResponse.data;
                    
                    if (backupData.status === 'success') {
                        // Merge data from backup API
                        data = {
                            ...data,
                            city: data.city || backupData.city,
                            region: data.region || backupData.regionName,
                            country_name: data.country_name || backupData.country,
                            latitude: data.latitude || backupData.lat,
                            longitude: data.longitude || backupData.lon,
                            org: data.org || backupData.org,
                            isp: data.isp || backupData.isp,
                            timezone: data.timezone || backupData.timezone
                        };
                    }
                } catch (backupError) {
                    console.warn('Backup API failed:', backupError);
                }
            }

            currentIPData = data;
            displayIPInfo(data);
            showToast('IP information loaded successfully!', 'success');
            
        } catch (error) {
            console.error('IP Lookup Error:', error);
            handleIPLookupError(error, ipAddress);
        } finally {
            setLoadingState(false);
        }
    }

    // Enhanced error handling
    function handleIPLookupError(error, ipAddress) {
        let errorMessage = 'Unable to fetch IP details. ';
        
        if (error.response) {
            if (error.response.status === 429) {
                errorMessage += 'Rate limit exceeded. Please try again in a moment.';
            } else if (error.response.status === 404) {
                errorMessage += 'IP address not found or invalid.';
            } else {
                errorMessage += 'Server error occurred.';
            }
        } else if (error.message.includes('Network Error')) {
            errorMessage += 'Network connection issue. Please check your internet connection.';
        } else {
            errorMessage += 'Please try again or use a different IP address.';
        }
        
        showToast(errorMessage);
        
        // Clear previous results on error
        clearResults();
    }

    // Enhanced display function with better data handling
    function displayIPInfo(data) {
        // Determine IP type
        const ipType = data.version === 6 || (data.ip && data.ip.includes(':')) ? 'IPv6' : 'IPv4';
        
        // Enhanced location info with fallbacks
        locationInfo.innerHTML = `
            <strong>City:</strong> ${data.city || 'Not available'}<br>
            <strong>Region:</strong> ${data.region || 'Not available'}<br>
            <strong>Country:</strong> ${data.country_name || 'Not available'}<br>
            <strong>Postal Code:</strong> ${data.postal || 'Not available'}
        `;

        // Enhanced network info
        networkInfo.innerHTML = `
            <strong>IP Address:</strong> ${data.ip || 'Not available'}<br>
            <strong>IP Type:</strong> ${ipType}<br>
            <strong>Network:</strong> ${data.network || 'Not available'}<br>
            <strong>Coordinates:</strong> ${data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : 'Not available'}
        `;

        // Enhanced ISP info with fallbacks
        const organization = data.org || data.isp || 'Not available';
        const asn = data.asn || 'Not available';
        const timezone = data.timezone || 'Not available';
        
        ispInfo.innerHTML = `
            <strong>ISP:</strong> ${organization}<br>
            <strong>ASN:</strong> ${asn}<br>
            <strong>Timezone:</strong> ${timezone}<br>
            <strong>Currency:</strong> ${data.currency_name || 'Not available'}
        `;

        // Enhanced technical details
        typeInfo.innerHTML = `
            <strong>IP Version:</strong> ${ipType}<br>
            <strong>Country Code:</strong> ${data.country_code || 'Not available'}<br>
            <strong>Languages:</strong> ${data.languages || 'Not available'}<br>
            <strong>Calling Code:</strong> ${data.country_calling_code || 'Not available'}
        `;

        // Initialize or update map
        initializeMap(data);
        
        // Show result section
        resultSection.style.display = 'block';
    }

    // Enhanced map initialization
    function initializeMap(data) {
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

            // Add marker with enhanced popup
            const popupContent = `
                <div class="map-popup">
                    <h4>${data.city || 'Unknown City'}, ${data.country_name || 'Unknown Country'}</h4>
                    <p><strong>IP:</strong> ${data.ip}</p>
                    <p><strong>ISP:</strong> ${data.org || data.isp || 'Unknown'}</p>
                    <p><strong>Coordinates:</strong> ${data.latitude}, ${data.longitude}</p>
                </div>
            `;
            
            L.marker([data.latitude, data.longitude])
                .addTo(map)
                .bindPopup(popupContent)
                .openPopup();
        } else {
            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="10" r="3"></circle>
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
                    </svg>
                    <p>Location information not available for this IP address</p>
                </div>
            `;
        }
    }

    // Clear results function
    function clearResults() {
        locationInfo.innerHTML = '-';
        networkInfo.innerHTML = '-';
        ispInfo.innerHTML = '-';
        typeInfo.innerHTML = '-';
        
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = '';
        
        currentIPData = null;
    }

    // Copy functionality with feedback
    function copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success feedback
            const originalIcon = buttonElement.innerHTML;
            buttonElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
            `;
            buttonElement.style.color = '#10b981';
            
            setTimeout(() => {
                buttonElement.innerHTML = originalIcon;
                buttonElement.style.color = '';
            }, 2000);
            
            showToast('Copied!', 'success');
        }).catch(() => {
            showToast('Failed to copy. Please try selecting and copying manually.');
        });
    }

    // Enhanced auto IP detection
    async function getMyIP() {
        setLoadingState(true);
        try {
            // Try multiple IP detection services
            const ipServices = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://api.myip.com'
            ];
            
            for (const service of ipServices) {
                try {
                    const response = await axios.get(service);
                    let myIP;
                    
                    if (response.data.ip) {
                        myIP = response.data.ip;
                    } else if (response.data.query) {
                        myIP = response.data.query;
                    }
                    
                    if (myIP) {
                        ipInput.value = myIP;
                        await fetchIPInfo(myIP);
                        return;
                    }
                } catch (error) {
                    console.warn(`IP service ${service} failed:`, error);
                    continue;
                }
            }
            
            throw new Error('All IP detection services failed');
            
        } catch (error) {
            console.error('Failed to fetch IP:', error);
            showToast('Unable to retrieve your IP address. Please enter it manually.');
        } finally {
            setLoadingState(false);
        }
    }

    // Event Listeners
    lookupBtn.addEventListener('click', () => {
        const ipAddress = ipInput.value.trim();
        fetchIPInfo(ipAddress);
    });

    myIpBtn.addEventListener('click', getMyIP);

    refreshBtn.addEventListener('click', () => {
        if (currentIPData && currentIPData.ip) {
            fetchIPInfo(currentIPData.ip);
        } else if (ipInput.value.trim()) {
            fetchIPInfo(ipInput.value.trim());
        } else {
            getMyIP();
        }
    });

    // Enter key support
    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const ipAddress = ipInput.value.trim();
            fetchIPInfo(ipAddress);
        }
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Copy button event listeners
    copyLocation.addEventListener('click', () => {
        if (currentIPData) {
            const locationText = `${currentIPData.city || 'N/A'}, ${currentIPData.region || 'N/A'}, ${currentIPData.country_name || 'N/A'}`;
            copyToClipboard(locationText, copyLocation);
        }
    });

    copyNetwork.addEventListener('click', () => {
        if (currentIPData) {
            copyToClipboard(currentIPData.ip || '', copyNetwork);
        }
    });

    copyISP.addEventListener('click', () => {
        if (currentIPData) {
            const ispText = `${currentIPData.org || currentIPData.isp || 'N/A'}`;
            copyToClipboard(ispText, copyISP);
        }
    });

    copyTechnical.addEventListener('click', () => {
        if (currentIPData) {
            const techText = `IP: ${currentIPData.ip || 'N/A'}, Type: ${currentIPData.version === 6 || (currentIPData.ip && currentIPData.ip.includes(':')) ? 'IPv6' : 'IPv4'}, ASN: ${currentIPData.asn || 'N/A'}`;
            copyToClipboard(techText, copyTechnical);
        }
    });

    // Initialize dark mode on page load
    initDarkMode();

    // Auto-load user's IP on page load
    setTimeout(() => {
        getMyIP();
    }, 500);
});
