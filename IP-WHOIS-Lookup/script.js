document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const whoisResults = document.getElementById('whoisResults');
    
    let map = null;

    // Function to fetch and display IP WHOIS information
    async function fetchIPInfo(ipAddress) {
        if (!validateIP(ipAddress)) {
            showToast('Please enter a valid IP address');
            return;
        }

        try {
            // Show loading state
            whoisResults.textContent = 'Loading WHOIS data...';
            
            // Use whoisjs.com API to get comprehensive WHOIS data
            const response = await axios.get(`https://whoisjs.com/api/v1/${ipAddress}`);
            
            if (response.data && response.data.raw) {
                // Update the WHOIS results with raw data
                whoisResults.textContent = response.data.raw;
            } else {
                // Fall back to rdap.org for WHOIS data
                const rdapResponse = await axios.get(`https://rdap.org/ip/${ipAddress}`);
                
                // Format the WHOIS information
                let formattedWhois = `WhatIsMyIP.com Whois Lookup Report for: ${ipAddress}\n\n`;
                
                if (rdapResponse.data) {
                    formattedWhois += `% Information related to '${ipAddress}'\n\n`;
                    
                    if (rdapResponse.data.handle) {
                        formattedWhois += `inetnum:        ${rdapResponse.data.handle}\n`;
                    }
                    
                    if (rdapResponse.data.name) {
                        formattedWhois += `netname:        ${rdapResponse.data.name}\n`;
                    }
                    
                    // Add network information
                    if (rdapResponse.data.cidr0_cidrs) {
                        formattedWhois += `cidr:           ${rdapResponse.data.cidr0_cidrs.join(', ')}\n`;
                    }
                    
                    // Add entity information
                    if (rdapResponse.data.entities && rdapResponse.data.entities.length > 0) {
                        formattedWhois += '\n';
                        
                        rdapResponse.data.entities.forEach(entity => {
                            if (entity.handle) {
                                formattedWhois += `organisation:   ${entity.handle}\n`;
                            }
                            
                            if (entity.vcardArray && entity.vcardArray[1]) {
                                const vcardData = entity.vcardArray[1];
                                
                                for (let i = 0; i < vcardData.length; i++) {
                                    const item = vcardData[i];
                                    
                                    if (item[0] === 'fn') {
                                        formattedWhois += `org-name:       ${item[3]}\n`;
                                    }
                                    
                                    if (item[0] === 'adr') {
                                        formattedWhois += `address:        ${item[3].join(', ')}\n`;
                                    }
                                    
                                    if (item[0] === 'tel') {
                                        formattedWhois += `phone:          tel:${item[3]}\n`;
                                    }
                                    
                                    if (item[0] === 'email') {
                                        formattedWhois += `email:          ${item[3]}\n`;
                                    }
                                }
                            }
                            
                            if (entity.roles) {
                                formattedWhois += `roles:          ${entity.roles.join(', ')}\n`;
                            }
                            
                            formattedWhois += '\n';
                        });
                    }
                    
                    // Try to get additional data from ipapi
                    try {
                        const ipapiResponse = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
                        const ipapiData = ipapiResponse.data;
                        
                        if (ipapiData) {
                            if (ipapiData.country_name) {
                                formattedWhois += `country:        ${ipapiData.country_name}\n`;
                            }
                            
                            if (ipapiData.region) {
                                formattedWhois += `region:         ${ipapiData.region}\n`;
                            }
                            
                            if (ipapiData.city) {
                                formattedWhois += `city:           ${ipapiData.city}\n`;
                            }
                            
                            if (ipapiData.org) {
                                formattedWhois += `org:            ${ipapiData.org}\n`;
                            }
                            
                            if (ipapiData.asn) {
                                formattedWhois += `asn:            ${ipapiData.asn}\n`;
                            }
                        }
                    } catch (ipapiError) {
                        console.error('Error fetching ipapi data:', ipapiError);
                    }
                    
                    // Add source information
                    formattedWhois += `source:         RDAP and ipapi.co # Filtered\n`;
                } else {
                    formattedWhois += "No WHOIS data available for this IP address.";
                }
                
                // Update the WHOIS results
                whoisResults.textContent = formattedWhois;
            }
            
            // Try to get geolocation for map display
            try {
                const ipWhoIsResponse = await axios.get(`https://ipwho.is/${ipAddress}`);
                const ipWhoIsData = ipWhoIsResponse.data;
                
                // Initialize or update map if coordinates are available
                const mapContainer = document.getElementById('mapContainer');
                mapContainer.innerHTML = ''; // Clear previous map
                
                // Check if latitude and longitude are available
                if (ipWhoIsData && ipWhoIsData.latitude && ipWhoIsData.longitude) {
                    const mapElement = document.createElement('div');
                    mapElement.style.width = '100%';
                    mapElement.style.height = '350px';
                    mapContainer.appendChild(mapElement);

                    // Initialize Leaflet map
                    map = L.map(mapElement).setView([ipWhoIsData.latitude, ipWhoIsData.longitude], 10);
                    
                    // Add tile layer (OpenStreetMap)
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: ' OpenStreetMap contributors'
                    }).addTo(map);

                    // Add marker
                    L.marker([ipWhoIsData.latitude, ipWhoIsData.longitude])
                        .addTo(map)
                        .bindPopup(`IP: ${ipWhoIsData.ip}<br>Location: ${ipWhoIsData.city}, ${ipWhoIsData.country}`)
                        .openPopup();
                } else {
                    mapContainer.innerHTML = '<p>Location information not available</p>';
                }
            } catch (mapError) {
                console.error('Error setting up map:', mapError);
                const mapContainer = document.getElementById('mapContainer');
                mapContainer.innerHTML = '<p>Location information not available</p>';
            }
        } catch (error) {
            console.error('IP WHOIS Lookup Error:', error);
            
            // Fallback to a simpler WHOIS API if the first one fails
            try {
                // Use ipwhois.app as another fallback
                const fallbackResponse = await axios.get(`https://ipwhois.app/json/${ipAddress}?objects=ip,success,type,country,country_code,region,city,latitude,longitude,org,isp,asn,timezone`);
                const fallbackData = fallbackResponse.data;
                
                if (fallbackData && fallbackData.success) {
                    let fallbackWhois = `WhatIsMyIP.com Whois Lookup Report for: ${ipAddress}\n\n`;
                    fallbackWhois += `% Information related to '${ipAddress}'\n\n`;
                    
                    fallbackWhois += `ip:             ${fallbackData.ip || 'N/A'}\n`;
                    fallbackWhois += `type:           IPv${fallbackData.type || '4'}\n`;
                    fallbackWhois += `city:           ${fallbackData.city || 'N/A'}\n`;
                    fallbackWhois += `region:         ${fallbackData.region || 'N/A'}\n`;
                    fallbackWhois += `country:        ${fallbackData.country || 'N/A'}\n`;
                    fallbackWhois += `org:            ${fallbackData.org || 'N/A'}\n`;
                    fallbackWhois += `isp:            ${fallbackData.isp || 'N/A'}\n`;
                    fallbackWhois += `asn:            ${fallbackData.asn || 'N/A'}\n`;
                    fallbackWhois += `timezone:       ${fallbackData.timezone || 'N/A'}\n`;
                    fallbackWhois += `latitude:       ${fallbackData.latitude || 'N/A'}\n`;
                    fallbackWhois += `longitude:      ${fallbackData.longitude || 'N/A'}\n`;
                    
                    fallbackWhois += `\nsource:         ipwhois.app # Filtered\n`;
                    
                    // Update the WHOIS results
                    whoisResults.textContent = fallbackWhois;
                    
                    // Update map with fallback data
                    if (fallbackData.latitude && fallbackData.longitude) {
                        const mapContainer = document.getElementById('mapContainer');
                        mapContainer.innerHTML = ''; // Clear previous map
                        const mapElement = document.createElement('div');
                        mapElement.style.width = '100%';
                        mapElement.style.height = '350px';
                        mapContainer.appendChild(mapElement);

                        // Initialize Leaflet map
                        map = L.map(mapElement).setView([fallbackData.latitude, fallbackData.longitude], 10);
                        
                        // Add tile layer (OpenStreetMap)
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: ' OpenStreetMap contributors'
                        }).addTo(map);

                        // Add marker
                        L.marker([fallbackData.latitude, fallbackData.longitude])
                            .addTo(map)
                            .bindPopup(`IP: ${fallbackData.ip}<br>Location: ${fallbackData.city}, ${fallbackData.country}`)
                            .openPopup();
                    } else {
                        const mapContainer = document.getElementById('mapContainer');
                        mapContainer.innerHTML = '<p>Location information not available</p>';
                    }
                } else {
                    whoisResults.textContent = `Error fetching WHOIS data for IP: ${ipAddress}. Please try again.`;
                }
            } catch (fallbackError) {
                console.error('Fallback WHOIS Lookup Error:', fallbackError);
                whoisResults.textContent = `Error fetching WHOIS data for IP: ${ipAddress}. Please try again.`;
            }
        }
    }

    function showToast(message) {
        if (document.querySelector('.toast-notification')) {
            document.querySelector('.toast-notification').remove();
        }
        
        const toast = document.createElement('div');
        toast.classList.add('toast-notification');
        toast.innerHTML = `
            <div class="toast-icon">⚠️</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">×</button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 5000);
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

    // Also trigger on Enter key in the input field
    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const ipAddress = ipInput.value.trim();
            fetchIPInfo(ipAddress);
        }
    });

    function validateIP(ip) {
        // More permissive IP validation to allow for both IPv4 and IPv6
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(':');
    }
});
