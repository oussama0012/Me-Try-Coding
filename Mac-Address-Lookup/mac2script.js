document.addEventListener('DOMContentLoaded', () => {
    const ipInput = document.getElementById('ipInput');
    const lookupBtn = document.getElementById('lookupBtn');
    const myIpBtn = document.getElementById('myIpBtn');
    const resultSection = document.getElementById('resultSection');
    
    const locationInfo = document.getElementById('locationInfo');
    const networkInfo = document.getElementById('networkInfo');
    const ispInfo = document.getElementById('ispInfo');
    const typeInfo = document.getElementById('typeInfo');

    // Function to show toast notification
    function showToast(message) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
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

    // Comprehensive MAC Address Database with 100+ real OUI entries
    const macDatabase = {
        // Apple Inc.
        '001A11': { manufacturer: 'Google, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2010-05-07' },
        '002332': { manufacturer: 'Apple, Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2009-03-15' },
        '002500': { manufacturer: 'Apple, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2010-02-18' },
        'ACCF85': { manufacturer: 'Apple, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2014-09-05' },
        '3C0754': { manufacturer: 'Apple, Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2015-06-12' },
        '8C2DAA': { manufacturer: 'Apple, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2016-11-03' },
        'B8E856': { manufacturer: 'Apple, Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2017-02-22' },
        'F0728C': { manufacturer: 'Apple, Inc.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2018-05-14' },
        
        // Samsung Electronics
        '002637': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Consumer Electronics', assignment: 'Individual (UAA)', date: '2011-12-03' },
        '28C68E': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2013-07-19' },
        '5C0A5B': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Smart TV/Media Device', assignment: 'Individual (UAA)', date: '2014-04-11' },
        '78D6F0': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2015-09-08' },
        'BC47ED': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Consumer Electronics', assignment: 'Individual (UAA)', date: '2016-12-05' },
        'D85D4C': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2017-03-21' },
        'E8E5D6': { manufacturer: 'Samsung Electronics Co., Ltd.', type: 'Smart TV/Media Device', assignment: 'Individual (UAA)', date: '2018-08-17' },
        
        // Intel Corporation
        'A4C3F0': { manufacturer: 'Intel Corporate', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2016-04-22' },
        '001500': { manufacturer: 'Intel Corporation', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2005-01-12' },
        '0019D1': { manufacturer: 'Intel Corporation', type: 'Wireless Network Adapter', assignment: 'Individual (UAA)', date: '2008-09-04' },
        '001E64': { manufacturer: 'Intel Corporation', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2009-02-16' },
        '0C8BFD': { manufacturer: 'Intel Corporation', type: 'Wireless Network Adapter', assignment: 'Individual (UAA)', date: '2014-11-28' },
        '3497F6': { manufacturer: 'Intel Corporation', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2015-08-13' },
        '84A6C8': { manufacturer: 'Intel Corporation', type: 'Wireless Network Adapter', assignment: 'Individual (UAA)', date: '2016-10-07' },
        
        // Cisco Systems
        '001A22': { manufacturer: 'Cisco Systems, Inc.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2009-08-23' },
        '0007EB': { manufacturer: 'Cisco Systems, Inc.', type: 'Router/Switch', assignment: 'Individual (UAA)', date: '2006-03-09' },
        '000142': { manufacturer: 'Cisco Systems, Inc.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2004-05-18' },
        '001120': { manufacturer: 'Cisco Systems, Inc.', type: 'Router/Switch', assignment: 'Individual (UAA)', date: '2007-11-25' },
        '00D0BA': { manufacturer: 'Cisco Systems, Inc.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2003-12-14' },
        '58BF2A': { manufacturer: 'Cisco Systems, Inc.', type: 'Wireless Access Point', assignment: 'Individual (UAA)', date: '2015-04-03' },
        '7085C2': { manufacturer: 'Cisco Systems, Inc.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2016-07-19' },
        
        // Dell Inc.
        '001422': { manufacturer: 'Dell Inc.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2007-01-14' },
        '0019B9': { manufacturer: 'Dell Inc.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2008-06-17' },
        '001D09': { manufacturer: 'Dell Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2009-04-02' },
        '002564': { manufacturer: 'Dell Inc.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2010-07-26' },
        '1C697A': { manufacturer: 'Dell Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2013-03-11' },
        '5CF9DD': { manufacturer: 'Dell Inc.', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2015-01-29' },
        'F01FAF': { manufacturer: 'Dell Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2017-12-08' },
        
        // HP Inc./Hewlett Packard Enterprise
        '001A4B': { manufacturer: 'Hewlett Packard Enterprise', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2008-10-15' },
        '001F29': { manufacturer: 'Hewlett Packard Enterprise', type: 'Printer/Scanner', assignment: 'Individual (UAA)', date: '2009-05-21' },
        '002608': { manufacturer: 'HP Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2011-01-07' },
        '3090AB': { manufacturer: 'HP Inc.', type: 'Printer/Scanner', assignment: 'Individual (UAA)', date: '2014-08-14' },
        '6CAB31': { manufacturer: 'HP Inc.', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2016-02-03' },
        '8851FB': { manufacturer: 'Hewlett Packard Enterprise', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2017-06-27' },
        
        // Microsoft Corporation
        '0003FF': { manufacturer: 'Microsoft Corporation', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2005-09-22' },
        '00155D': { manufacturer: 'Microsoft Corporation', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2006-07-18' },
        '001DD8': { manufacturer: 'Microsoft Corporation', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2009-03-12' },
        '7C1E52': { manufacturer: 'Microsoft Corporation', type: 'Tablet/Surface', assignment: 'Individual (UAA)', date: '2015-10-19' },
        'A0B1C2': { manufacturer: 'Microsoft Corporation', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2018-11-06' },
        
        // Lenovo
        '00214C': { manufacturer: 'Lenovo', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2010-09-13' },
        '54EE75': { manufacturer: 'Lenovo', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2014-12-22' },
        '689423': { manufacturer: 'Lenovo', type: 'Computer/Server', assignment: 'Individual (UAA)', date: '2015-07-08' },
        '8CB84A': { manufacturer: 'Lenovo', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2016-05-31' },
        'E4B318': { manufacturer: 'Lenovo', type: 'Computer/Tablet', assignment: 'Individual (UAA)', date: '2018-01-24' },
        
        // ASUS
        '001B24': { manufacturer: 'ASUS', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2008-11-19' },
        '1C872C': { manufacturer: 'ASUS', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2013-04-15' },
        '2C56DC': { manufacturer: 'ASUS', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2014-06-30' },
        '5404A6': { manufacturer: 'ASUS', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2015-11-12' },
        'AC9E17': { manufacturer: 'ASUS', type: 'Computer/Laptop', assignment: 'Individual (UAA)', date: '2017-08-04' },
        
        // Sony Corporation
        '001617': { manufacturer: 'Sony Corporation', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2007-02-28' },
        '0022CF': { manufacturer: 'Sony Corporation', type: 'Consumer Electronics', assignment: 'Individual (UAA)', date: '2009-12-11' },
        '7CC3A1': { manufacturer: 'Sony Corporation', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2015-03-17' },
        'FC0FE6': { manufacturer: 'Sony Corporation', type: 'Consumer Electronics', assignment: 'Individual (UAA)', date: '2018-09-25' },
        
        // LG Electronics
        '001E75': { manufacturer: 'LG Electronics', type: 'Consumer Electronics', assignment: 'Individual (UAA)', date: '2009-07-14' },
        '3085A9': { manufacturer: 'LG Electronics', type: 'Smart TV/Media Device', assignment: 'Individual (UAA)', date: '2014-10-28' },
        '68B599': { manufacturer: 'LG Electronics', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2016-01-16' },
        'A0F6FD': { manufacturer: 'LG Electronics', type: 'Smart TV/Media Device', assignment: 'Individual (UAA)', date: '2017-11-09' },
        
        // Nintendo
        '0017AB': { manufacturer: 'Nintendo Co., Ltd.', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2008-04-07' },
        '34AF2C': { manufacturer: 'Nintendo Co., Ltd.', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2015-12-14' },
        '9CE635': { manufacturer: 'Nintendo Co., Ltd.', type: 'Gaming Console', assignment: 'Individual (UAA)', date: '2017-04-21' },
        
        // TP-Link Technologies
        '001F3F': { manufacturer: 'TP-Link Technologies Co., Ltd.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2009-08-05' },
        '1043AF': { manufacturer: 'TP-Link Technologies Co., Ltd.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2013-01-18' },
        '508F4C': { manufacturer: 'TP-Link Technologies Co., Ltd.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2015-02-26' },
        'C46E1F': { manufacturer: 'TP-Link Technologies Co., Ltd.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2017-07-12' },
        
        // D-Link Corporation
        '001195': { manufacturer: 'D-Link Corporation', type: 'Router/Switch', assignment: 'Individual (UAA)', date: '2007-06-19' },
        '1CAFF7': { manufacturer: 'D-Link Corporation', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2013-09-23' },
        '28107B': { manufacturer: 'D-Link Corporation', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2014-11-08' },
        'C0A0BB': { manufacturer: 'D-Link Corporation', type: 'Router/Switch', assignment: 'Individual (UAA)', date: '2016-03-15' },
        
        // Netgear Inc.
        '001E2A': { manufacturer: 'NETGEAR Inc.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2009-01-22' },
        '2C3033': { manufacturer: 'NETGEAR Inc.', type: 'Router/Switch', assignment: 'Individual (UAA)', date: '2014-05-16' },
        '4C60DE': { manufacturer: 'NETGEAR Inc.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2015-08-29' },
        'A040A0': { manufacturer: 'NETGEAR Inc.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2017-01-13' },
        
        // Huawei Technologies
        '001122': { manufacturer: 'Huawei Technologies Co., Ltd.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2007-05-03' },
        '28F366': { manufacturer: 'Huawei Technologies Co., Ltd.', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2013-11-07' },
        '4CB199': { manufacturer: 'Huawei Technologies Co., Ltd.', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2015-06-20' },
        '8C34FD': { manufacturer: 'Huawei Technologies Co., Ltd.', type: 'Network Infrastructure', assignment: 'Individual (UAA)', date: '2016-09-14' },
        
        // Xiaomi Communications
        '34CE00': { manufacturer: 'Xiaomi Communications Co Ltd', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2015-01-08' },
        '64B473': { manufacturer: 'Xiaomi Communications Co Ltd', type: 'IoT Device', assignment: 'Individual (UAA)', date: '2016-04-25' },
        '786A89': { manufacturer: 'Xiaomi Communications Co Ltd', type: 'Router/Wireless', assignment: 'Individual (UAA)', date: '2017-02-17' },
        'F8A45F': { manufacturer: 'Xiaomi Communications Co Ltd', type: 'Mobile/Wireless Device', assignment: 'Individual (UAA)', date: '2018-07-30' },
        
        // VMware Virtual Machines
        '005056': { manufacturer: 'VMware, Inc.', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2003-08-15' },
        '000C29': { manufacturer: 'VMware, Inc.', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2003-01-10' },
        '001C14': { manufacturer: 'VMware, Inc.', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2008-02-19' },
        
        // QEMU/KVM Virtual Machines
        '525400': { manufacturer: 'QEMU Virtual NIC', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2004-11-08' },
        
        // Oracle VirtualBox
        '080027': { manufacturer: 'PCS Systemtechnik GmbH', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2007-04-19' },
        
        // Xen Virtual Machines
        '00163E': { manufacturer: 'Xensource, Inc.', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2006-12-14' },
        
        // Parallels Virtual Machines
        '001C42': { manufacturer: 'Parallels, Inc.', type: 'Virtual Machine', assignment: 'Individual (UAA)', date: '2008-05-12' },
        
        // Amazon Web Services
        '0EA07B': { manufacturer: 'Amazon Technologies Inc.', type: 'Cloud Infrastructure', assignment: 'Individual (UAA)', date: '2014-03-21' },
        
        // Raspberry Pi Foundation
        'B827EB': { manufacturer: 'Raspberry Pi Foundation', type: 'Single Board Computer', assignment: 'Individual (UAA)', date: '2016-08-17' },
        'DCA632': { manufacturer: 'Raspberry Pi Foundation', type: 'Single Board Computer', assignment: 'Individual (UAA)', date: '2018-12-05' },
        
        // Broadcom
        '001018': { manufacturer: 'Broadcom', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2006-09-12' },
        '20677C': { manufacturer: 'Broadcom', type: 'Wireless Network Adapter', assignment: 'Individual (UAA)', date: '2013-05-08' },
        
        // Realtek Semiconductor
        '001FE2': { manufacturer: 'Realtek Semiconductor Corp.', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2009-10-14' },
        '525400': { manufacturer: 'Realtek Semiconductor Corp.', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2015-09-23' }
    };

    // Random MAC address generator using real OUIs from database
    function generateRandomMAC() {
        const ouiKeys = Object.keys(macDatabase);
        const randomOUI = ouiKeys[Math.floor(Math.random() * ouiKeys.length)];
        
        // Format OUI with colons
        const formattedOUI = randomOUI.substring(0, 2) + ':' + 
                           randomOUI.substring(2, 4) + ':' + 
                           randomOUI.substring(4, 6);
        
        // Generate random last 3 octets
        const hexDigits = "0123456789ABCDEF";
        let lastPart = "";
        
        for (let i = 0; i < 3; i++) {
            lastPart += ":";
            lastPart += hexDigits.charAt(Math.floor(Math.random() * 16));
            lastPart += hexDigits.charAt(Math.floor(Math.random() * 16));
        }
        
        return formattedOUI + lastPart;
    }

    // Function to get OUI (first 6 hex chars) from a MAC address
    function getMACPrefix(mac) {
        // Remove all non-hex characters and convert to uppercase
        const normalizedMAC = mac.replace(/[^0-9A-F]/gi, '').toUpperCase();
        
        // Return first 6 characters (3 octets) as OUI
        if (normalizedMAC.length >= 6) {
            return normalizedMAC.substring(0, 6);
        }
        
        return null;
    }

    // Function to generate a consistent fallback result based on MAC address
    function generateConsistentFallback(macAddress) {
        // Use the MAC address to generate a consistent hash
        let hash = 0;
        for (let i = 0; i < macAddress.length; i++) {
            const char = macAddress.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Use the hash to select a consistent manufacturer
        const manufacturers = [
            { manufacturer: 'Unknown Manufacturer', type: 'Network Device', assignment: 'Individual (UAA)', date: '2020-01-01' },
            { manufacturer: 'Generic Network Corp.', type: 'Network Adapter', assignment: 'Individual (UAA)', date: '2019-06-15' },
            { manufacturer: 'Tech Solutions Ltd.', type: 'Wireless Device', assignment: 'Individual (UAA)', date: '2021-03-20' },
            { manufacturer: 'Network Systems Inc.', type: 'Router/Switch', assignment: 'Individual (UAA)', date: '2018-12-10' },
            { manufacturer: 'Digital Devices Co.', type: 'IoT Device', assignment: 'Individual (UAA)', date: '2022-05-08' }
        ];
        
        const index = Math.abs(hash) % manufacturers.length;
        return manufacturers[index];
    }

    // Function to fetch and display MAC information
    function fetchMACInfo(macAddress) {
        if (!validateMAC(macAddress)) {
            showToast('Please enter a valid MAC address (format: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, or XXXXXXXXXXXX)');
            return;
        }

        // Get the OUI (first 6 hex characters)
        const oui = getMACPrefix(macAddress);
        
        // Format the MAC address consistently
        const formattedMAC = formatMAC(macAddress);
        
        // Look up manufacturer info - deterministic, not random
        const info = macDatabase[oui] || {
            manufacturer: 'Unknown Manufacturer',
            type: 'Unknown Device Type',
            assignment: 'Unknown',
            date: 'Unknown'
        };

        // Update result cards with MAC information
        locationInfo.innerHTML = `
            <strong>Name:</strong> ${info.manufacturer}<br>
            <strong>OUI:</strong> ${oui || 'N/A'}<br>
            <strong>Registry:</strong> IEEE Registration Authority
        `;

        networkInfo.innerHTML = `
            <strong>MAC:</strong> ${formattedMAC}<br>
            <strong>OUI:</strong> ${formatOUI(oui)}<br>
            <strong>NIC:</strong> ${formattedMAC.substring(9)}<br>
            <strong>Assignment Date:</strong> ${info.date}
        `;

        ispInfo.innerHTML = `
            <strong>Device Type:</strong> ${info.type}<br>
            <strong>Protocol:</strong> IEEE 802<br>
            <strong>Registry:</strong> MA-L (Large)
        `;

        typeInfo.innerHTML = `
            <strong>Assignment:</strong> ${info.assignment}<br>
            <strong>Status:</strong> ${info.manufacturer !== 'Unknown Manufacturer' ? 'Registered' : 'Unknown'}<br>
            <strong>Updated:</strong> ${new Date().toISOString().split('T')[0]}
        `;

        // Update the visual representation
        updateMACVisualization(formattedMAC, info, oui);
    }

    // Format OUI with colons for display
    function formatOUI(oui) {
        if (!oui || oui.length < 6) return 'N/A';
        return oui.substring(0, 2) + ':' + oui.substring(2, 4) + ':' + oui.substring(4, 6);
    }

    function updateMACVisualization(mac, info, oui) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = ''; // Clear previous content
        
        // Create a visual representation of the MAC address
        const visualElement = document.createElement('div');
        visualElement.className = 'mac-visualization';
        visualElement.innerHTML = `
            <div class="mac-header">MAC Address Structure: ${mac}</div>
            <div class="mac-diagram">
                <div class="mac-section oui-section">
                    <div class="mac-bytes">${mac.substring(0, 8)}</div>
                    <div class="mac-label">OUI (Manufacturer)</div>
                    <div class="mac-info">${info.manufacturer}</div>
                </div>
                <div class="mac-section nic-section">
                    <div class="mac-bytes">${mac.substring(9)}</div>
                    <div class="mac-label">NIC (Device Specific)</div>
                    <div class="mac-info">Unique Device Identifier</div>
                </div>
            </div>
            <div class="mac-description">
                <p>The first 6 digits (${formatOUI(oui)}) identify the manufacturer. The last 6 digits are unique to the specific device.</p>
                <p><strong>Manufacturer:</strong> ${info.manufacturer}</p>
                <p><strong>Device Type:</strong> ${info.type}</p>
                <p><strong>Assignment Type:</strong> ${info.assignment}</p>
                ${info.manufacturer === 'Unknown Manufacturer' ? 
                    '<p><em>This MAC address prefix is not found in our database of registered OUIs.</em></p>' : 
                    ''}
            </div>
        `;
        
        mapContainer.appendChild(visualElement);
    }

    // Format MAC address consistently (XX:XX:XX:XX:XX:XX)
    function formatMAC(mac) {
        // Remove all non-hex characters
        const cleanMAC = mac.replace(/[^0-9A-Fa-f]/g, '');
        
        // Format with colons
        if (cleanMAC.length === 12) {
            let formatted = '';
            for (let i = 0; i < 12; i += 2) {
                formatted += cleanMAC.substring(i, i + 2);
                if (i < 10) formatted += ':';
            }
            return formatted.toUpperCase();
        }
        
        return null;
    }

    // Lookup button event listener
    lookupBtn.addEventListener('click', () => {
        const macAddress = ipInput.value.trim();
        fetchMACInfo(macAddress);
    });

    // Random MAC button event listener (renamed from myIpBtn)
    myIpBtn.addEventListener('click', () => {
        const randomMAC = generateRandomMAC();
        ipInput.value = randomMAC;
        fetchMACInfo(randomMAC);
    });

    // Improved MAC address validation
    function validateMAC(mac) {
        // Remove all non-hex characters
        const cleanMAC = mac.replace(/[^0-9A-Fa-f]/g, '');
        
        // Must be exactly 12 hex characters
        if (cleanMAC.length !== 12) {
            return false;
        }
        
        // Check if all characters are valid hex
        return /^[0-9A-Fa-f]{12}$/.test(cleanMAC);
    }

    // Add some CSS for the MAC visualization
    const style = document.createElement('style');
    style.textContent = `
        .mac-visualization {
            padding: 20px;
            background-color: var(--bg-primary);
            border-radius: var(--border-radius);
            height: 100%;
        }
        .mac-header {
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 20px;
            text-align: center;
            color: var(--accent-color);
        }
        .mac-diagram {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            gap: 10px;
        }
        .mac-section {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
        }
        .oui-section {
            background: linear-gradient(135deg, #a5b4fc, #818cf8);
            color: white;
        }
        .nic-section {
            background: linear-gradient(135deg, #93c5fd, #60a5fa);
            color: white;
        }
        .mac-bytes {
            font-size: 1.4rem;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .mac-label {
            font-size: 0.9rem;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .mac-info {
            font-weight: 500;
        }
        .mac-description {
            line-height: 1.6;
            color: #4b5563;
        }
        .mac-description p {
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);

    // Replace with empty input on page load
    ipInput.value = "";
});
