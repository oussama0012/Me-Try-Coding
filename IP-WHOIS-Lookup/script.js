document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const whoisResults = document.getElementById('whoisResults');
    
    let map = null;

    // Function to fetch and display IP WHOIS information
    async function fetchIPInfo(ipAddress) {
        if (!validateIP(ipAddress)) {
            alert('Please enter a valid IP address');
            return;
        }

        try {
            // Show loading state
            whoisResults.textContent = 'Loading WHOIS data...';
            
            // Get raw WHOIS data using the RDAP API
            const response = await axios.get(`https://rdap.org/ip/${ipAddress}`);
            
            // Get additional WHOIS data from another source for completeness
            const ipWhoIsResponse = await axios.get(`https://ipwho.is/${ipAddress}`);
            const ipWhoIsData = ipWhoIsResponse.data;
            
            // Format the WHOIS information in a similar format to WhatIsMyIP
            let formattedWhois = `WhatIsMyIP.com Whois Lookup Report for: ${ipAddress}\n\n`;
            
            if (response.data) {
                // Add RDAP data
                formattedWhois += `% Information related to '${ipAddress}'\n\n`;
                
                if (response.data.handle) {
                    formattedWhois += `inetnum:        ${response.data.handle}\n`;
                }
                
                if (response.data.name) {
                    formattedWhois += `netname:        ${response.data.name}\n`;
                }
                
                // Add network information
                if (response.data.cidr0_cidrs) {
                    formattedWhois += `cidr:           ${response.data.cidr0_cidrs.join(', ')}\n`;
                }
                
                // Add entity information
                if (response.data.entities && response.data.entities.length > 0) {
                    formattedWhois += '\n';
                    
                    response.data.entities.forEach(entity => {
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
                
                // Add remarks and country info from ipwho.is
                if (ipWhoIsData) {
                    if (ipWhoIsData.country) {
                        formattedWhois += `country:        ${ipWhoIsData.country}\n`;
                    }
                    
                    if (ipWhoIsData.region) {
                        formattedWhois += `region:         ${ipWhoIsData.region}\n`;
                    }
                    
                    if (ipWhoIsData.city) {
                        formattedWhois += `city:           ${ipWhoIsData.city}\n`;
                    }
                    
                    if (ipWhoIsData.connection && ipWhoIsData.connection.isp) {
                        formattedWhois += `isp:            ${ipWhoIsData.connection.isp}\n`;
                    }
                    
                    if (ipWhoIsData.connection && ipWhoIsData.connection.org) {
                        formattedWhois += `org:            ${ipWhoIsData.connection.org}\n`;
                    }
                    
                    if (ipWhoIsData.connection && ipWhoIsData.connection.domain) {
                        formattedWhois += `domain:         ${ipWhoIsData.connection.domain}\n`;
                    }
                }
                
                // Add source information
                formattedWhois += `source:         RDAP and ipwho.is # Filtered\n`;
            } else {
                formattedWhois += "No WHOIS data available for this IP address.";
            }
            
            // Update the WHOIS results
            whoisResults.textContent = formattedWhois;
            
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

        } catch (error) {
            console.error('IP WHOIS Lookup Error:', error);
            
            // Fallback to a simpler WHOIS API if the first one fails
            try {
                const fallbackResponse = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
                const fallbackData = fallbackResponse.data;
                
                let fallbackWhois = `WhatIsMyIP.com Whois Lookup Report for: ${ipAddress}\n\n`;
                fallbackWhois += `% Information related to '${ipAddress}'\n\n`;
                
                fallbackWhois += `ip:             ${fallbackData.ip || 'N/A'}\n`;
                fallbackWhois += `version:        IPv${fallbackData.version || '4'}\n`;
                fallbackWhois += `city:           ${fallbackData.city || 'N/A'}\n`;
                fallbackWhois += `region:         ${fallbackData.region || 'N/A'}\n`;
                fallbackWhois += `country:        ${fallbackData.country_name || 'N/A'}\n`;
                fallbackWhois += `org:            ${fallbackData.org || 'N/A'}\n`;
                fallbackWhois += `asn:            ${fallbackData.asn || 'N/A'}\n`;
                fallbackWhois += `postal:         ${fallbackData.postal || 'N/A'}\n`;
                fallbackWhois += `timezone:       ${fallbackData.timezone || 'N/A'}\n`;
                fallbackWhois += `latitude:       ${fallbackData.latitude || 'N/A'}\n`;
                fallbackWhois += `longitude:      ${fallbackData.longitude || 'N/A'}\n`;
                
                fallbackWhois += `\nsource:         ipapi.co # Filtered\n`;
                
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
                        .bindPopup(`IP: ${fallbackData.ip}<br>Location: ${fallbackData.city}, ${fallbackData.country_name}`)
                        .openPopup();
                } else {
                    const mapContainer = document.getElementById('mapContainer');
                    mapContainer.innerHTML = '<p>Location information not available</p>';
                }
            } catch (fallbackError) {
                console.error('Fallback WHOIS Lookup Error:', fallbackError);
                whoisResults.textContent = `Error fetching WHOIS data for IP: ${ipAddress}. Please try again.`;
            }
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
            alert('Unable to retrieve your IP address. Please try again.');
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
