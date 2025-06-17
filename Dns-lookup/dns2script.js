document.addEventListener('DOMContentLoaded', () => {
    const domainInput = document.getElementById('domainInput');
    const lookupBtn = document.getElementById('lookupBtn');
    
    const card1Info = document.getElementById('card1Info');
    const card2Info = document.getElementById('card2Info');
    const card3Info = document.getElementById('card3Info');
    const card4Info = document.getElementById('card4Info');
    const mapContainer = document.getElementById('mapContainer');

    let map = null;
    const initialMapMessage = '<p style="text-align: center; padding-top: 20px;">Enter a domain to see map data for A records.</p>';

    // DNS providers configuration
    const DNS_PROVIDERS = [
        { 
            name: 'Cloudflare', 
            url: 'https://cloudflare-dns.com/dns-query',
            timeout: 8000
        },
        { 
            name: 'Quad9', 
            url: 'https://dns.quad9.net/dns-query',
            timeout: 10000
        },
        { 
            name: 'Google', 
            url: 'https://dns.google/resolve',
            timeout: 10000
        }
    ];

    // Rate limiting
    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

    // Loading state management
    let isLoading = false;

    // Network connectivity check
    async function checkNetworkConnectivity() {
        try {
            // Use a simpler approach - try to create a connection to a reliable endpoint
            // This will work even if CORS is blocked since we're just checking connectivity
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            // Use navigator.onLine first as a quick check
            if (!navigator.onLine) {
                return false;
            }
            
            // Try a simple fetch to a reliable endpoint that supports CORS
            const response = await fetch('https://httpbin.org/get', {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);
            return true; // If we get here, we have connectivity
        } catch (error) {
            // If the above fails, try an alternative approach
            try {
                const img = new Image();
                return new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(true); // Even errors mean we have connectivity
                    img.src = 'https://www.google.com/favicon.ico?' + Date.now();
                    
                    // Timeout after 3 seconds
                    setTimeout(() => resolve(false), 3000);
                });
            } catch (fallbackError) {
                // Final fallback - just return true and let the DNS query handle the error
                return true;
            }
        }
    }

    // Clean domain name
    function cleanDomainName(input) {
        if (!input || typeof input !== 'string') return '';
        
        let cleanDomain = input.trim().toLowerCase();
        
        // Check for email addresses
        if (cleanDomain.includes('@')) {
            throw new Error('Please enter a domain name only, not an email address (e.g., google.com instead of user@google.com)');
        }
        
        // Remove protocols
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
        cleanDomain = cleanDomain.replace(/^ftp:\/\//, '');
        
        // Remove www prefix
        cleanDomain = cleanDomain.replace(/^www\./, '');
        
        // Remove paths, query parameters, and fragments
        cleanDomain = cleanDomain.split('/')[0];
        cleanDomain = cleanDomain.split('?')[0];
        cleanDomain = cleanDomain.split('#')[0];
        
        // Remove port numbers
        cleanDomain = cleanDomain.split(':')[0];
        
        // Remove trailing dots
        cleanDomain = cleanDomain.replace(/\.+$/, '');
        
        return cleanDomain;
    }

    // Validate domain name format
    function validateDomain(domain) {
        if (!domain || typeof domain !== 'string') return false;
        
        // Basic domain validation regex
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
        
        // Check length constraints
        if (domain.length > 253) return false;
        
        // Check each label
        const labels = domain.split('.');
        for (const label of labels) {
            if (label.length === 0 || label.length > 63) return false;
            if (label.startsWith('-') || label.endsWith('-')) return false;
        }
        
        return domainRegex.test(domain);
    }

    // Sanitize record data
    function sanitizeRecordData(data) {
        if (!data) return '';
        return String(data)
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/&/g, "&amp;");
    }

    // DNS query with retry logic and exponential backoff
    async function queryDNSWithRetry(domain, recordType, maxRetries = 3) {
        let lastError;
        
        for (let providerIndex = 0; providerIndex < DNS_PROVIDERS.length; providerIndex++) {
            const provider = DNS_PROVIDERS[providerIndex];
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), provider.timeout);
                    
                    let url;
                    const headers = {
                        'Accept': 'application/dns-json',
                        'User-Agent': 'DNS-Lookup-Tool/1.0'
                    };
                    
                    if (provider.name === 'Google') {
                        url = `${provider.url}?name=${encodeURIComponent(domain)}&type=${recordType}`;
                    } else {
                        url = `${provider.url}?name=${encodeURIComponent(domain)}&type=${recordType}`;
                    }
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: headers,
                        signal: controller.signal,
                        mode: 'cors'
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    
                    // Handle DNS response status codes
                    if (data.Status !== undefined) {
                        switch (data.Status) {
                            case 0: // NOERROR
                                return { success: true, data: data, provider: provider.name };
                            case 3: // NXDOMAIN
                                return { success: false, error: 'Domain not found (NXDOMAIN)', provider: provider.name };
                            case 2: // SERVFAIL
                                throw new Error('Server failure (SERVFAIL)');
                            case 5: // REFUSED
                                throw new Error('Query refused by server');
                            default:
                                throw new Error(`DNS query failed with status ${data.Status}`);
                        }
                    }
                    
                    return { success: true, data: data, provider: provider.name };
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`DNS query attempt ${attempt + 1}/${maxRetries} failed for provider ${provider.name}:`, error.message);
                    
                    // Exponential backoff delay
                    if (attempt < maxRetries - 1) {
                        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        }
        
        return { success: false, error: lastError?.message || 'All DNS providers failed', provider: 'none' };
    }

    // Geolocation with fallback
    async function getGeolocation(ip) {
        const geoProviders = [
            { url: `https://ipapi.co/${ip}/json/`, name: 'ipapi.co' },
            { url: `https://ip-api.com/json/${ip}`, name: 'ip-api.com' }
        ];
        
        for (const provider of geoProviders) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(provider.url, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (compatible; DNS-Lookup-Tool/1.0)'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Check for API errors
                if (provider.name === 'ipapi.co') {
                    if (data.error) {
                        throw new Error(`ipapi.co error: ${data.reason || 'Unknown error'}`);
                    }
                    // Validate required fields
                    if (data.latitude && data.longitude && !isNaN(data.latitude) && !isNaN(data.longitude)) {
                        return {
                            latitude: parseFloat(data.latitude),
                            longitude: parseFloat(data.longitude),
                            city: data.city || 'Unknown',
                            region: data.region || data.region_code || 'Unknown',
                            country_name: data.country_name || data.country || 'Unknown',
                            provider: provider.name
                        };
                    }
                } else if (provider.name === 'ip-api.com') {
                    if (data.status === 'fail') {
                        throw new Error(`ip-api.com error: ${data.message || 'Unknown error'}`);
                    }
                    // Validate required fields
                    if (data.lat && data.lon && !isNaN(data.lat) && !isNaN(data.lon)) {
                        return {
                            latitude: parseFloat(data.lat),
                            longitude: parseFloat(data.lon),
                            city: data.city || 'Unknown',
                            region: data.regionName || data.region || 'Unknown',
                            country_name: data.country || 'Unknown',
                            provider: provider.name
                        };
                    }
                }
                
                throw new Error('Invalid geolocation data received');
                
            } catch (error) {
                console.warn(`Geolocation failed for provider ${provider.name}:`, error.message);
                continue; // Try next provider
            }
        }
        
        // If all providers fail, return null
        console.error('All geolocation providers failed');
        return null;
    }

    // Function to show toast notification
    function showToast(message, isError = true) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        if (isError) {
            toast.style.background = 'linear-gradient(135deg, #f44336, #e53935)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #4CAF50, #43A047)';
        }
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Loading state management
    function setLoadingState(loading) {
        isLoading = loading;
        lookupBtn.disabled = loading;
        
        if (loading) {
            lookupBtn.innerHTML = `
                <div class="loading-spinner"></div>
                Looking up...
            `;
        } else {
            lookupBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Lookup
            `;
        }
    }

    function formatRecordList(records) {
        if (!records || records.length === 0) {
            return 'No records found.';
        }
        let html = '<ul>';
        records.forEach(record => {
            const sanitizedRecord = sanitizeRecordData(record);
            html += `<li>${sanitizedRecord}</li>`;
        });
        html += '</ul>';
        return html;
    }
    
    function formatMxRecordList(records) {
        if (!records || records.length === 0) {
            return 'No MX records found.';
        }
        let html = '<ul>';
        records.forEach(record => {
            const parts = String(record).split(' ');
            const priority = parts.length > 1 ? parts[0] : '?';
            const server = parts.length > 1 ? parts.slice(1).join(' ') : record;
            const sanitizedPriority = sanitizeRecordData(priority);
            const sanitizedServer = sanitizeRecordData(server);
            html += `<li>Priority: ${sanitizedPriority}, Server: ${sanitizedServer}</li>`;
        });
        html += '</ul>';
        return html;
    }

    // Function to fetch and display DNS information
    async function fetchDNSInfo(domainName) {
        // Rate limiting check
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
            showToast('Please wait a moment before making another request');
            return;
        }
        lastRequestTime = now;

        // Remove the network connectivity check that was causing issues
        // The DNS query will handle network errors appropriately

        let cleanDomain;
        try {
            cleanDomain = cleanDomainName(domainName);
        } catch (error) {
            showToast(error.message);
            return;
        }

        if (!validateDomain(cleanDomain)) {
            showToast('Please enter a valid domain name (e.g., google.com, subdomain.example.org)');
            return;
        }

        setLoadingState(true);

        // Reset previous results
        card1Info.innerHTML = '<div class="loading-indicator">Loading A records...</div>';
        card2Info.innerHTML = '<div class="loading-indicator">Loading AAAA records...</div>';
        card3Info.innerHTML = '<div class="loading-indicator">Loading MX records...</div>';
        card4Info.innerHTML = '<div class="loading-indicator">Loading other records...</div>';
        clearMap();
        mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px;">Loading map data...</p>';

        const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT'];
        
        try {
            // Use Promise.allSettled for better error handling
            const promises = recordTypes.map(type => 
                queryDNSWithRetry(cleanDomain, type)
            );

            const results = await Promise.allSettled(promises);

            let aRecords = [];
            let aaaaRecords = [];
            let mxRecordsData = [];
            let cnameRecords = [];
            let nsRecords = [];
            let txtRecords = [];
            let geoIpForMap = null;

            results.forEach((result, index) => {
                const recordType = recordTypes[index];
                
                if (result.status === 'fulfilled' && result.value.success && result.value.data.Answer) {
                    const answers = result.value.data.Answer;

                    switch(recordType) {
                        case 'A':
                            aRecords = answers.map(ans => ans.data);
                            if (aRecords.length > 0) geoIpForMap = aRecords[0];
                            break;
                        case 'AAAA':
                            aaaaRecords = answers.map(ans => ans.data);
                            break;
                        case 'MX':
                            mxRecordsData = answers.map(ans => ans.data);
                            break;
                        case 'CNAME':
                            cnameRecords = answers.map(ans => ans.data);
                            break;
                        case 'NS':
                            nsRecords = answers.map(ans => ans.data);
                            break;
                        case 'TXT':
                            txtRecords = answers.map(ans => 
                                String(ans.data).replace(/^"|"$/g, '').replace(/""/g, '"')
                            );
                            break;
                    }
                } else if (result.status === 'fulfilled' && !result.value.success) {
                    console.warn(`${recordType} query failed:`, result.value.error);
                } else {
                    console.error(`${recordType} query rejected:`, result.reason);
                }
            });

            // Update A Records & GeoIP card
            if (aRecords.length > 0) {
                let geoHtml = '';
                if (geoIpForMap) {
                    try {
                        const geoInfo = await getGeolocation(geoIpForMap);
                        if (geoInfo && geoInfo.latitude && geoInfo.longitude) {
                            updateMap(geoInfo.latitude, geoInfo.longitude, 
                                `IP: ${geoIpForMap}\nLocation: ${geoInfo.city}, ${geoInfo.region}, ${geoInfo.country_name}\nProvider: ${geoInfo.provider}`);
                            geoHtml = `<p><strong>GeoIP for ${sanitizeRecordData(geoIpForMap)}:</strong><br>
                                Location: ${sanitizeRecordData(geoInfo.city)}, ${sanitizeRecordData(geoInfo.region)}, ${sanitizeRecordData(geoInfo.country_name)}<br>
                                <small>Data from: ${sanitizeRecordData(geoInfo.provider)}</small></p>`;
                        } else {
                            mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px; color: #f44336;">Geolocation data not available for this IP address.</p>';
                        }
                    } catch (geoError) {
                        console.error('GeoIP lookup error:', geoError);
                        mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px; color: #f44336;">Could not fetch geolocation data. This may be due to a private IP address or API limitations.</p>';
                    }
                }
                card1Info.innerHTML = geoHtml + formatRecordList(aRecords);
            } else {
                card1Info.innerHTML = 'No A records found.';
                mapContainer.innerHTML = initialMapMessage;
            }
            
            // Update AAAA Records card
            card2Info.innerHTML = formatRecordList(aaaaRecords);

            // Update MX Records card
            card3Info.innerHTML = formatMxRecordList(mxRecordsData);

            // Update Other Records card (CNAME, NS, TXT)
            let otherHtml = '';
            if (cnameRecords.length > 0) {
                otherHtml += `<strong>CNAME:</strong>${formatRecordList(cnameRecords)}`;
            }
            if (nsRecords.length > 0) {
                otherHtml += `<strong>NS:</strong>${formatRecordList(nsRecords)}`;
            }
            if (txtRecords.length > 0) {
                otherHtml += `<strong>TXT:</strong>${formatRecordList(txtRecords.map(txt => 
                    txt.length > 100 ? txt.substring(0, 97) + '...' : txt
                ))}`;
            }
            card4Info.innerHTML = otherHtml || 'No CNAME, NS, or TXT records found.';
            if (!geoIpForMap && aRecords.length === 0) { // If no A records, reset map message
                 mapContainer.innerHTML = initialMapMessage;
            }

            showToast(`DNS lookup completed successfully for ${cleanDomain}`, false);

        } catch (error) {
            console.error('DNS Lookup Error:', error);
            showToast('Unable to fetch DNS details. Please check the domain or try again.');
            card1Info.innerHTML = 'Error loading A records';
            card2Info.innerHTML = 'Error loading AAAA records';
            card3Info.innerHTML = 'Error loading MX records';
            card4Info.innerHTML = 'Error loading other records';
            mapContainer.innerHTML = initialMapMessage;
        } finally {
            setLoadingState(false);
        }
    }

    function clearMap() {
        if (map) {
            map.remove();
            map = null;
        }
        mapContainer.innerHTML = initialMapMessage;
    }
    
    function updateMap(lat, lon, popupText) {
        if (map) {
            map.remove();
        }
        mapContainer.innerHTML = '';
        const mapElement = document.createElement('div');
        mapElement.style.width = '100%';
        mapElement.style.height = '100%';
        mapContainer.appendChild(mapElement);

        try {
            map = L.map(mapElement).setView([lat, lon], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);
            
            const marker = L.marker([lat, lon]).addTo(map);
            
            // Format popup text properly
            const formattedPopup = sanitizeRecordData(popupText).replace(/\n/g, '<br>');
            marker.bindPopup(formattedPopup).openPopup();
            
            // Ensure map renders properly
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
            
        } catch (mapError) {
            console.error('Map creation error:', mapError);
            mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px; color: #f44336;">Error displaying map. Location data may be invalid.</p>';
        }
    }

    lookupBtn.addEventListener('click', () => {
        if (isLoading) return;
        const domainName = domainInput.value.trim();
        if (domainName) {
            fetchDNSInfo(domainName);
        } else {
            showToast('Please enter a domain name');
        }
    });
    
    domainInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !isLoading) {
            const domainName = domainInput.value.trim();
            if (domainName) {
                fetchDNSInfo(domainName);
            } else {
                showToast('Please enter a domain name');
            }
        }
    });

    // Initialize
    mapContainer.innerHTML = initialMapMessage;
});
