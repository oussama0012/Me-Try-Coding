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

    // Enhanced IP information fetching with multiple APIs
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
            // Multiple API endpoints for better reliability
            const apiEndpoints = [
                {
                    url: `https://ipapi.co/${ipAddress}/json/`,
                    parser: (data) => {
                        if (data.error) throw new Error(data.reason || 'IP lookup failed');
                        return {
                            ip: data.ip,
                            city: data.city,
                            region: data.region,
                            country_name: data.country_name,
                            country_code: data.country_code,
                            latitude: data.latitude,
                            longitude: data.longitude,
                            org: data.org,
                            isp: data.isp,
                            timezone: data.timezone,
                            postal: data.postal,
                            asn: data.asn,
                            network: data.network,
                            version: data.version,
                            currency_name: data.currency_name,
                            languages: data.languages,
                            country_calling_code: data.country_calling_code
                        };
                    }
                },
                {
                    url: `https://ip-api.com/json/${ipAddress}`,
                    parser: (data) => {
                        if (data.status === 'fail') throw new Error(data.message || 'IP lookup failed');
                        return {
                            ip: data.query,
                            city: data.city,
                            region: data.regionName,
                            country_name: data.country,
                            country_code: data.countryCode,
                            latitude: data.lat,
                            longitude: data.lon,
                            org: data.org,
                            isp: data.isp,
                            timezone: data.timezone,
                            postal: data.zip,
                            asn: data.as,
                            network: data.as
                        };
                    }
                },
                {
                    url: `https://ipinfo.io/${ipAddress}/json`,
                    parser: (data) => {
                        if (data.error) throw new Error(data.error.message || 'IP lookup failed');
                        const coords = data.loc ? data.loc.split(',') : [null, null];
                        return {
                            ip: data.ip,
                            city: data.city,
                            region: data.region,
                            country_name: data.country,
                            country_code: data.country,
                            latitude: coords[0] ? parseFloat(coords[0]) : null,
                            longitude: coords[1] ? parseFloat(coords[1]) : null,
                            org: data.org,
                            isp: data.org,
                            timezone: data.timezone,
                            postal: data.postal
                        };
                    }
                }
            ];

            let lastError = null;
            
            for (const endpoint of apiEndpoints) {
                try {
                    console.log(`Trying API: ${endpoint.url}`);
                    const response = await axios.get(endpoint.url, { timeout: 10000 });
                    const data = endpoint.parser(response.data);
                    
                    // Ensure we have basic data
                    if (data.ip) {
                        currentIPData = data;
                        displayIPInfo(data);
                        showToast('IP information loaded successfully!', 'success');
                        return;
                    }
                } catch (error) {
                    console.warn(`API ${endpoint.url} failed:`, error);
                    lastError = error;
                    continue;
                }
            }
            
            throw lastError || new Error('All IP lookup services failed');
            
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
            } else if (error.response.status === 0) {
                errorMessage += 'Network blocked. Please check your connection or try a different network.';
            } else {
                errorMessage += `Server error (${error.response.status}). Please try again.`;
            }
        } else if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            errorMessage += 'Network connection issue. Please check your internet connection.';
        } else if (error.message.includes('CORS')) {
            errorMessage += 'Browser security restriction. Please try refreshing the page.';
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

    // Enhanced map initialization with better error handling
    function initializeMap(data) {
        const mapContainer = document.getElementById('mapContainer');
        
        // Clear previous map and ensure clean state
        if (map) {
            map.remove();
            map = null;
        }
        mapContainer.innerHTML = '';
        
        // Check if latitude and longitude are available
        if (data.latitude && data.longitude && !isNaN(data.latitude) && !isNaN(data.longitude)) {
            try {
                const mapElement = document.createElement('div');
                mapElement.style.width = '100%';
                mapElement.style.height = '350px';
                mapElement.style.borderRadius = '16px';
                mapElement.style.overflow = 'hidden';
                mapContainer.appendChild(mapElement);

                // Wait for the element to be in DOM before initializing map
                setTimeout(() => {
                    try {
                        // Initialize Leaflet map with error handling
                        map = L.map(mapElement, {
                            center: [data.latitude, data.longitude],
                            zoom: 10,
                            zoomControl: true,
                            scrollWheelZoom: true,
                            doubleClickZoom: true,
                            dragging: true
                        });
                        
                        // Add multiple tile layer options for better reliability
                        const tileLayers = [
                            {
                                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                attribution: '© OpenStreetMap contributors'
                            },
                            {
                                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                                attribution: '© OpenTopoMap contributors'
                            },
                            {
                                url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                                attribution: '© CartoDB'
                            }
                        ];

                        // Try to add tile layer with fallback
                        let tileLayerAdded = false;
                        for (const layer of tileLayers) {
                            try {
                                L.tileLayer(layer.url, {
                                    attribution: layer.attribution,
                                    maxZoom: 18,
                                    timeout: 10000
                                }).addTo(map);
                                tileLayerAdded = true;
                                break;
                            } catch (tileError) {
                                console.warn('Tile layer failed:', layer.url, tileError);
                                continue;
                            }
                        }

                        if (!tileLayerAdded) {
                            throw new Error('All tile layers failed to load');
                        }

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

                        // Force map to invalidate size after a short delay
                        setTimeout(() => {
                            if (map) {
                                map.invalidateSize();
                            }
                        }, 100);

                    } catch (mapError) {
                        console.error('Map initialization failed:', mapError);
                        showMapError('Map failed to load. Please refresh the page.');
                    }
                }, 100);

            } catch (error) {
                console.error('Map container creation failed:', error);
                showMapError('Unable to create map container.');
            }
        } else {
            showMapError('Location information not available for this IP address');
        }
    }

    // Helper function to show map error
    function showMapError(message) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = `
            <div class="map-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="10" r="3"></circle>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }

    // Clear results function
    function clearResults() {
        locationInfo.innerHTML = '-';
        networkInfo.innerHTML = '-';
        ispInfo.innerHTML = '-';
        typeInfo.innerHTML = '-';
        
        const mapContainer = document.getElementById('mapContainer');
        if (map) {
            map.remove();
            map = null;
        }
        mapContainer.innerHTML = '';
        
        currentIPData = null;
    }

    // Copy functionality with feedback
    function copyToClipboard(text, buttonElement) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showCopySuccess(buttonElement);
            }).catch(() => {
                fallbackCopy(text, buttonElement);
            });
        } else {
            fallbackCopy(text, buttonElement);
        }
    }

    function showCopySuccess(buttonElement) {
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
    }

    function fallbackCopy(text, buttonElement) {
        // Fallback copy method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopySuccess(buttonElement);
        } catch (err) {
            showToast('Failed to copy. Please try selecting and copying manually.');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // Enhanced auto IP detection with multiple services
    async function getMyIP() {
        setLoadingState(true);
        try {
            // Multiple IP detection services for better reliability
            const ipServices = [
                {
                    url: 'https://api.ipify.org?format=json',
                    parser: (data) => data.ip
                },
                {
                    url: 'https://ipapi.co/json/',
                    parser: (data) => data.ip
                },
                {
                    url: 'https://ip-api.com/json/',
                    parser: (data) => data.query
                },
                {
                    url: 'https://ipinfo.io/json',
                    parser: (data) => data.ip
                }
            ];
            
            for (const service of ipServices) {
                try {
                    console.log(`Trying IP service: ${service.url}`);
                    const response = await axios.get(service.url, { timeout: 5000 });
                    const myIP = service.parser(response.data);
                    
                    if (myIP && validateIP(myIP)) {
                        ipInput.value = myIP;
                        await fetchIPInfo(myIP);
                        return;
                    }
                } catch (error) {
                    console.warn(`IP service ${service.url} failed:`, error);
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

    // Auto-load user's IP on page load with delay to ensure DOM is ready
    setTimeout(() => {
        getMyIP();
    }, 1000);
});
