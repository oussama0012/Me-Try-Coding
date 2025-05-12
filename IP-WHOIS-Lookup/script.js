document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const whoisResults = document.getElementById('whoisResults');
    
    let map = null;

    async function fetchIPInfo(ipAddress) {
        if (!validateIP(ipAddress)) {
            alert('Please enter a valid IP address');
            return;
        }

        try {
            whoisResults.textContent = 'Loading WHOIS data...';
            
            const whoisResponse = await axios.get(`https://whois.ws/api/v1/${ipAddress}?key=free`, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (whoisResponse.data && whoisResponse.data.result) {
                const data = whoisResponse.data.result;
                
                let formattedWhois = `WhatIsMyIP.com Whois Lookup Report for: ${ipAddress}\n`;
                
                if (data.registry) {
                    formattedWhois += `% This is the ${data.registry} Whois server.\n`;
                    formattedWhois += `% The ${data.registry} whois database is subject to terms of use.\n\n`;
                }
                
                formattedWhois += `% Note: this output has been filtered.\n`;
                formattedWhois += `%       To receive output for a database update, use the "-B" flag.\n\n`;
                
                formattedWhois += `% Information related to '${data.network || ipAddress}'\n\n`;
                
                if (data.network) {
                    formattedWhois += `inetnum:        ${data.network}\n`;
                }
                
                if (data.netname) {
                    formattedWhois += `netname:        ${data.netname}\n`;
                }
                
                if (data.organization) {
                    formattedWhois += `organisation:   ${data.organization}\n`;
                }
                
                if (data.orgname) {
                    formattedWhois += `org-name:       ${data.orgname}\n`;
                }
                
                if (data.country) {
                    formattedWhois += `country:        ${data.country}\n`;
                }
                
                if (data.city) {
                    formattedWhois += `city:           ${data.city}\n`;
                }
                
                if (data.address) {
                    const addresses = Array.isArray(data.address) ? data.address : [data.address];
                    addresses.forEach(addr => {
                        formattedWhois += `address:        ${addr}\n`;
                    });
                }
                
                if (data.phones) {
                    const phones = Array.isArray(data.phones) ? data.phones : [data.phones];
                    phones.forEach(phone => {
                        formattedWhois += `phone:          ${phone}\n`;
                    });
                }
                
                if (data.emails) {
                    const emails = Array.isArray(data.emails) ? data.emails : [data.emails];
                    emails.forEach(email => {
                        formattedWhois += `email:          ${email}\n`;
                    });
                }
                
                if (data.created) {
                    formattedWhois += `created:        ${data.created}\n`;
                }
                
                if (data.updated) {
                    formattedWhois += `last-modified:  ${data.updated}\n`;
                }
                
                if (data.abuse_emails) {
                    formattedWhois += `abuse-mailbox:  ${data.abuse_emails}\n`;
                }
                
                formattedWhois += `\nsource:         ${data.registry || 'WHOIS'} # Filtered\n`;
                
                if (data.raw) {
                    formattedWhois += `\n${data.raw}\n`;
                }
                
                whoisResults.textContent = formattedWhois;
                
                if (data.latitude && data.longitude) {
                    updateMap(data.latitude, data.longitude, ipAddress, data.country, data.city);
                } else {
                    try {
                        const geoResponse = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
                        if (geoResponse.data && geoResponse.data.latitude && geoResponse.data.longitude) {
                            updateMap(geoResponse.data.latitude, geoResponse.data.longitude, ipAddress, geoResponse.data.country_name, geoResponse.data.city);
                        } else {
                            document.getElementById('mapContainer').innerHTML = '<p>Location information not available</p>';
                        }
                    } catch (err) {
                        document.getElementById('mapContainer').innerHTML = '<p>Location information not available</p>';
                    }
                }
            } else {
                fallbackWhoisLookup(ipAddress);
            }
        } catch (error) {
            console.error('IP WHOIS Lookup Error:', error);
            fallbackWhoisLookup(ipAddress);
        }
    }

    async function fallbackWhoisLookup(ipAddress) {
        try {
            const response = await axios.get(`https://ipwhois.app/json/${ipAddress}`);
            const data = response.data;
            
            let fallbackWhois = `WhatIsMyIP.com Whois Lookup Report for: ${ipAddress}\n\n`;
            fallbackWhois += `% Information related to '${ipAddress}'\n\n`;
            
            if (data.ip) {
                fallbackWhois += `ip:             ${data.ip}\n`;
            }
            
            if (data.type) {
                fallbackWhois += `version:        IPv${data.type === 'IPv4' ? '4' : '6'}\n`;
            }
            
            if (data.org) {
                fallbackWhois += `organisation:   ${data.org}\n`;
            }
            
            if (data.isp) {
                fallbackWhois += `isp:            ${data.isp}\n`;
            }
            
            if (data.asn) {
                fallbackWhois += `asn:            ${data.asn}\n`;
            }
            
            if (data.country) {
                fallbackWhois += `country:        ${data.country}\n`;
            }
            
            if (data.region) {
                fallbackWhois += `region:         ${data.region}\n`;
            }
            
            if (data.city) {
                fallbackWhois += `city:           ${data.city}\n`;
            }
            
            if (data.timezone) {
                fallbackWhois += `timezone:       ${data.timezone}\n`;
            }
            
            fallbackWhois += `\nsource:         ipwhois.app # Filtered\n`;
            
            whoisResults.textContent = fallbackWhois;
            
            if (data.latitude && data.longitude) {
                updateMap(data.latitude, data.longitude, ipAddress, data.country, data.city);
            } else {
                document.getElementById('mapContainer').innerHTML = '<p>Location information not available</p>';
            }
        } catch (fallbackError) {
            console.error('Fallback WHOIS Lookup Error:', fallbackError);
            whoisResults.textContent = `Error fetching WHOIS data for IP: ${ipAddress}. Please try again.`;
            document.getElementById('mapContainer').innerHTML = '<p>Location information not available</p>';
        }
    }

    function updateMap(lat, lon, ip, country, city) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = ''; // Clear previous map
        
        const mapElement = document.createElement('div');
        mapElement.style.width = '100%';
        mapElement.style.height = '350px';
        mapContainer.appendChild(mapElement);

        map = L.map(mapElement).setView([lat, lon], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`IP: ${ip}<br>Location: ${city || 'Unknown'}, ${country || 'Unknown'}`)
            .openPopup();
    }

    lookupBtn.addEventListener('click', () => {
        const ipAddress = ipInput.value.trim();
        fetchIPInfo(ipAddress);
    });

    myIpBtn.addEventListener('click', async () => {
        try {
            const response = await axios.get('https://api.ipify.org?format=json');
            const myIP = response.data.ip;
            
            ipInput.value = myIP;
            fetchIPInfo(myIP);
        } catch (error) {
            console.error('Failed to fetch IP:', error);
            alert('Unable to retrieve your IP address. Please try again.');
        }
    });

    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const ipAddress = ipInput.value.trim();
            fetchIPInfo(ipAddress);
        }
    });

    function validateIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(':');
    }
});
