document.addEventListener('DOMContentLoaded', () => {
    const domainInput = document.getElementById('domainInput');
    const lookupBtn = document.getElementById('lookupBtn');
    // const resultSection = document.getElementById('resultSection'); // No longer directly used for showing/hiding
    
    const card1Info = document.getElementById('card1Info');
    const card2Info = document.getElementById('card2Info');
    const card3Info = document.getElementById('card3Info');
    const card4Info = document.getElementById('card4Info');
    const mapContainer = document.getElementById('mapContainer');


    let map = null;
    const initialMapMessage = '<p style="text-align: center; padding-top: 20px;">Enter a domain to see map data for A records.</p>';

    // Function to show toast notification
    function showToast(message, isError = true) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        if (isError) {
            toast.style.background = 'linear-gradient(135deg, #f44336, #e53935)'; // Error red
        } else {
            toast.style.background = 'linear-gradient(135deg, #4CAF50, #43A047)'; // Success green
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
        }, 3000);
    }

    function formatRecordList(records) {
        if (!records || records.length === 0) {
            return 'No records found.';
        }
        let html = '<ul>';
        records.forEach(record => {
            // Sanitize record data before inserting into HTML
            const sanitizedRecord = String(record).replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
             // MX data is "priority FQDN"
            const parts = record.split(' ');
            const priority = parts.length > 1 ? parts[0] : '?';
            const server = parts.length > 1 ? parts.slice(1).join(' ') : record;
            const sanitizedPriority = String(priority).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const sanitizedServer = String(server).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            html += `<li>Priority: ${sanitizedPriority}, Server: ${sanitizedServer}</li>`;
        });
        html += '</ul>';
        return html;
    }

    // Function to fetch and display DNS information
    async function fetchDNSInfo(domainName) {
        // Preprocess domainName to remove http(s)://, www., and any paths/queries
        let cleanDomain = domainName.trim();
        try {
            // Attempt to parse as URL to easily extract hostname
            const url = new URL(cleanDomain.startsWith('http') ? cleanDomain : `http://${cleanDomain}`);
            cleanDomain = url.hostname;
        } catch (e) {
            // If URL parsing fails, it might be a domain without protocol, or an invalid string.
            // Try to strip common prefixes and paths manually.
            cleanDomain = cleanDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, ''); // Remove http(s):// and www.
            cleanDomain = cleanDomain.split('/')[0]; // Remove any path
            cleanDomain = cleanDomain.split('?')[0]; // Remove any query parameters
        }
        
        // Further cleanup: remove trailing slashes or dots if any survived
        cleanDomain = cleanDomain.replace(/\/+$/, '').replace(/\.+$/, '');


        if (!validateDomain(cleanDomain)) {
            showToast('Please enter a valid domain name (e.g., google.com)');
            return;
        }

        // Reset previous results and map
        card1Info.innerHTML = '<em>Loading A records...</em>';
        card2Info.innerHTML = '<em>Loading AAAA records...</em>';
        card3Info.innerHTML = '<em>Loading MX records...</em>';
        card4Info.innerHTML = '<em>Loading other records...</em>';
        clearMap();
        mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px;">Loading map data...</p>';


        const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT'];
        let geoIpForMap = null; 
        let geoInfoForDisplay = null;

        try {
            const promises = recordTypes.map(type => 
                axios.get(`https://dns.google/resolve?name=${cleanDomain}&type=${type}`)
                    .then(response => ({ type, data: response.data }))
                    .catch(error => ({ type, error: true, statusText: error.message })) // Catch individual errors
            );

            const results = await Promise.all(promises);

            let aRecords = [];
            let aaaaRecords = [];
            let mxRecordsData = [];
            let cnameRecords = [];
            let nsRecords = [];
            let txtRecords = [];

            results.forEach(result => {
                if (result.error || !result.data || result.data.Status !== 0 || !result.data.Answer) {
                    // Handle error or no answer for this type
                    console.warn(`No ${result.type} records found or error for ${cleanDomain}:`, result.data ? `Status ${result.data.Status}` : result.statusText);
                    return; 
                }
                
                const answers = result.data.Answer;

                switch(result.type) {
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
                        // TXT records can be arrays of strings, join them if so, or just be a single string.
                        // Google DNS API often returns TXT data as a single string, potentially with escaped quotes.
                        // For display, we'll show them as is.
                        txtRecords = answers.map(ans => ans.data.replace(/^"|"$/g, '').replace(/""/g, '"')); // Basic unquoting
                        break;
                }
            });

            // Update A Records & GeoIP card
            if (aRecords.length > 0) {
                let geoHtml = '';
                if (geoIpForMap) {
                    try {
                        const geoResponse = await axios.get(`https://ipapi.co/${geoIpForMap}/json/`);
                        geoInfoForDisplay = geoResponse.data;
                        if (geoInfoForDisplay.latitude && geoInfoForDisplay.longitude) {
                            updateMap(geoInfoForDisplay.latitude, geoInfoForDisplay.longitude, `${geoInfoForDisplay.city || 'N/A'}, ${geoInfoForDisplay.country_name || 'N/A'}`);
                            geoHtml = `<p><strong>GeoIP for ${geoIpForMap}:</strong> ${geoInfoForDisplay.city || 'N/A'}, ${geoInfoForDisplay.region || 'N/A'}, ${geoInfoForDisplay.country_name || 'N/A'}</p>`;
                        } else {
                             mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px;">Geolocation data not available for this IP.</p>';
                        }
                    } catch (geoError) {
                        console.error('GeoIP lookup error:', geoError);
                        mapContainer.innerHTML = '<p style="text-align: center; padding-top: 20px;">Could not fetch geolocation data.</p>';
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
                otherHtml += `<strong>TXT:</strong>${formatRecordList(txtRecords.map(txt => txt.length > 100 ? txt.substring(0, 97) + '...' : txt))}`; // Truncate long TXT records for display
            }
            card4Info.innerHTML = otherHtml || 'No CNAME, NS, or TXT records found.';
            if (!geoIpForMap && aRecords.length === 0) { // If no A records, reset map message
                 mapContainer.innerHTML = initialMapMessage;
            }


        } catch (error) {
            console.error('DNS Lookup Error:', error);
            showToast('Unable to fetch DNS details. Please check the domain or try again.');
            card1Info.innerHTML = '-';
            card2Info.innerHTML = '-';
            card3Info.innerHTML = '-';
            card4Info.innerHTML = '-';
            mapContainer.innerHTML = initialMapMessage;
        }
    }

    function clearMap() {
        if (map) {
            map.remove();
            map = null;
        }
        mapContainer.innerHTML = initialMapMessage; // Reset to initial message
    }
    
    function updateMap(lat, lon, popupText) {
        if (map) {
            map.remove(); // Remove existing map instance
        }
        // Ensure mapContainer is empty before creating a new map
        mapContainer.innerHTML = ''; 
        const mapElement = document.createElement('div');
        mapElement.style.width = '100%';
        mapElement.style.height = '100%'; // Fill mapContainer
        mapContainer.appendChild(mapElement);

        map = L.map(mapElement).setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(map);
        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(popupText)
            .openPopup();
    }


    lookupBtn.addEventListener('click', () => {
        const domainName = domainInput.value.trim();
        fetchDNSInfo(domainName);
    });
    
    domainInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const domainName = domainInput.value.trim();
            fetchDNSInfo(domainName);
        }
    });


    function validateDomain(domain) {
        if (!domain) return false;
        // Basic domain validation: not empty, contains at least one dot, and doesn't start/end with a dot or hyphen.
        // Allows for internationalized domain names (IDNs) by not restricting characters too much.
        const domainRegex = /^(?!-)[A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,63}$/i;
        // A simpler regex that is more permissive for hostnames/subdomains:
        const simpleDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        // For simplicity, just check if it contains a dot and has some length.
        // A more robust validation might be too complex here.
        return domain.includes('.') && domain.length > 3 && domain.length < 256;
    }

    // Initialize map placeholder
    mapContainer.innerHTML = initialMapMessage;
});
