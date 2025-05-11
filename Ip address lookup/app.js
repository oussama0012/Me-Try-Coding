document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const resultSection = document.getElementById('resultSection');
    
    const locationInfo = document.getElementById('locationInfo');
    const networkInfo = document.getElementById('networkInfo');
    const ispInfo = document.getElementById('ispInfo');
    const typeInfo = document.getElementById('typeInfo');

    let map = null;

    // Function to fetch and display IP information
    async function fetchIPInfo(ipAddress) {
        if (!validateIP(ipAddress)) {
            alert('Please enter a valid IP address');
            return;
        }

        try {
            const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
            const data = response.data;

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
                <strong>Version:</strong> ${data.version === 4 ? 'IPv4' : 'IPv6'}<br>
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
            alert('Unable to fetch IP details. Please try again.');
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

    function validateIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
});
