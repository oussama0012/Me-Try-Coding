document.addEventListener('DOMContentLoaded', () => {
    const domainInput = document.getElementById('domainInput');
    const recordTypeSelect = document.getElementById('recordTypeSelect');
    const lookupBtn = document.getElementById('lookupBtn');
    const resultSection = document.getElementById('resultSection');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    const locationInfo = document.getElementById('locationInfo');
    const networkInfo = document.getElementById('networkInfo');
    const ispInfo = document.getElementById('ispInfo');
    const typeInfo = document.getElementById('typeInfo');

    let currentDNSData = null; // Store current DNS data for export
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

    // Function to fetch and display DNS information
    async function fetchDNSInfo(domain, recordType = 'ALL') {
        // Clean the domain input before validation
        const originalDomain = domain;
        
        // Remove protocol if present
        domain = domain.replace(/^[a-zA-Z][a-zA-Z\d+\-\.]*:\/\//, '');
        // Remove www prefix if present
        domain = domain.replace(/^www\./, '');
        // Remove port number if present
        domain = domain.replace(/:\d+/, '');
        // Remove path, query params, and fragments
        domain = domain.split('/')[0].split('?')[0].split('#')[0].trim();
        
        // Update the input field with the cleaned domain
        if (domainInput) {
            domainInput.value = domain;
        }

        if (!validateDomain(domain)) {
            showToast('Please enter a valid domain name (e.g., google.com, example.org). IP addresses and localhost are not allowed.');
            return;
        }

        try {
            // Show loading state
            resultSection.innerHTML = `
                <div class="whois-header">
                    <h2>DNS Lookup ( ${domain} )</h2>
                </div>
                <div class="whois-content">
                    <div class="raw-whois-data">
                        <pre>Fetching DNS records for ${domain}...
Please wait while we query DNS servers...</pre>
                    </div>
                </div>
            `;

            // Fetch DNS records for all types or specific type
            const recordTypes = recordType === 'ALL' ? ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'] : [recordType];
            const dnsResults = {};

            for (const type of recordTypes) {
                try {
                    const records = await fetchDNSRecordsWithFallback(domain, type);
                    dnsResults[type] = records;
                } catch (error) {
                    console.warn(`Failed to fetch ${type} records:`, error);
                    dnsResults[type] = [];
                }
            }

            // Process and store results
            currentDNSData = {
                domain: domain,
                timestamp: new Date().toISOString(),
                ...dnsResults
            };

            // Generate and display DNS report
            const dnsReport = generateDNSLookupReport(currentDNSData);
            
            resultSection.innerHTML = `
                <div class="whois-header">
                    <h2>DNS Lookup ( ${domain} )</h2>
                </div>
                <div class="whois-content">
                    <div class="raw-whois-data">
                        <pre>${dnsReport}</pre>
                    </div>
                </div>
                <div class="export-section">
                    <button id="exportJsonBtn" class="export-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export as JSON
                    </button>
                    <button id="exportTxtBtn" class="export-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export as Text
                    </button>
                    <button id="copyAllBtn" class="export-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy DNS Data
                    </button>
                </div>
            `;

            // Re-setup export buttons
            setupExportButtons();

        } catch (error) {
            console.error('DNS Lookup Error:', error);
            resultSection.innerHTML = `
                <div class="whois-header">
                    <h2>DNS Lookup Error</h2>
                </div>
                <div class="whois-content">
                    <div class="raw-whois-data">
                        <pre>Error: Unable to fetch DNS records for ${domain}

Possible causes:
- Domain does not exist
- DNS servers are temporarily unavailable
- Network connectivity issues

Please check the domain name and try again.</pre>
                    </div>
                </div>
            `;
            showToast('Unable to fetch DNS records. Please check the domain and try again.');
        }
    }

    // Function to fetch DNS records with multiple fallback APIs
    async function fetchDNSRecordsWithFallback(domain, recordType) {
        const apis = [
            // Cloudflare DNS-over-HTTPS
            {
                url: `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`,
                headers: { 'Accept': 'application/dns-json' }
            },
            // Google DNS-over-HTTPS
            {
                url: `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`,
                headers: { 'Accept': 'application/json' }
            },
            // Alternative DNS API
            {
                url: `https://dns-api.org/api/${encodeURIComponent(domain)}/${recordType}`,
                headers: { 'Accept': 'application/json' }
            }
        ];

        for (const api of apis) {
            try {
                const response = await axios.get(api.url, {
                    headers: api.headers,
                    timeout: 15000
                });

                if (response.data && response.status === 200) {
                    return parseDNSResponse(response.data, recordType);
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${api.url}:`, error.message);
                continue;
            }
        }

        // If all APIs fail, try a simple fetch approach
        try {
            const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`, {
                headers: { 'Accept': 'application/dns-json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return parseDNSResponse(data, recordType);
            }
        } catch (error) {
            console.warn('Fetch fallback failed:', error);
        }

        return [];
    }

    // Function to parse DNS response from different APIs
    function parseDNSResponse(data, recordType) {
        const records = [];

        // Handle Cloudflare/Google DNS-over-HTTPS format
        if (data.Answer) {
            data.Answer.forEach(record => {
                records.push({
                    name: record.name,
                    type: getRecordTypeName(record.type),
                    TTL: record.TTL,
                    data: record.data
                });
            });
        }

        // Handle Authority section for NS records if no Answer
        if (records.length === 0 && data.Authority && recordType === 'NS') {
            data.Authority.forEach(record => {
                if (record.type === 2) { // NS record type
                    records.push({
                        name: record.name,
                        type: 'NS',
                        TTL: record.TTL,
                        data: record.data
                    });
                }
            });
        }

        // Handle alternative API formats
        if (records.length === 0 && Array.isArray(data)) {
            data.forEach(record => {
                records.push({
                    name: record.name || record.domain,
                    type: record.type || recordType,
                    TTL: record.ttl || record.TTL || 'N/A',
                    data: record.value || record.data || record.address
                });
            });
        }

        return records;
    }

    // Function to generate DNS lookup report
    function generateDNSLookupReport(dnsData) {
        const timestamp = new Date(dnsData.timestamp).toUTCString();
        let report = `DNS Lookup Report for: ${dnsData.domain}\nQuery Time: ${timestamp}\n\n`;
        
        report += '; Query completed\n';
        report += '; Results obtained using DNS-over-HTTPS\n\n';

        const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'];
        let totalRecords = 0;

        recordTypes.forEach(type => {
            if (dnsData[type] && dnsData[type].length > 0) {
                report += `;; ${type} RECORDS\n`;
                dnsData[type].forEach(record => {
                    const name = record.name.endsWith('.') ? record.name : record.name + '.';
                    const ttl = record.TTL || 'N/A';
                    const data = record.data;
                    
                    if (type === 'MX') {
                        // Parse MX record format (priority + server)
                        const parts = data.split(' ');
                        const priority = parts[0] || '10';
                        const server = parts.slice(1).join(' ') || data;
                        report += `${name.padEnd(30)} ${ttl.toString().padEnd(8)} IN ${type.padEnd(6)} ${priority} ${server}\n`;
                    } else if (type === 'TXT') {
                        // Handle TXT records with quotes
                        const txtData = data.includes('"') ? data : `"${data}"`;
                        report += `${name.padEnd(30)} ${ttl.toString().padEnd(8)} IN ${type.padEnd(6)} ${txtData}\n`;
                    } else {
                        report += `${name.padEnd(30)} ${ttl.toString().padEnd(8)} IN ${type.padEnd(6)} ${data}\n`;
                    }
                    totalRecords++;
                });
                report += '\n';
            }
        });

        if (totalRecords === 0) {
            report += ';; No DNS records found\n';
            report += ';; This could mean:\n';
            report += ';;   - The domain does not exist\n';
            report += ';;   - DNS records are not properly configured\n';
            report += ';;   - DNS propagation is still in progress\n\n';
        }

        report += `;; Query time: ${new Date().getTime() - new Date(dnsData.timestamp).getTime()}ms\n`;
        report += `;; SERVER: Multiple DNS-over-HTTPS providers\n`;
        report += `;; WHEN: ${timestamp}\n`;
        report += `;; MSG SIZE rcvd: ${report.length} bytes\n`;

        return report;
    }

    // Function to fetch DNS records using DNS-over-HTTPS
    async function fetchDNSRecords(domain, recordType) {
        const dohEndpoints = [
            `https://cloudflare-dns.com/dns-query?name=${domain}&type=${recordType}`,
            `https://dns.google/resolve?name=${domain}&type=${recordType}`
        ];

        for (const endpoint of dohEndpoints) {
            try {
                const response = await axios.get(endpoint, {
                    headers: {
                        'Accept': 'application/dns-json'
                    },
                    timeout: 10000
                });
                
                if (response.data) {
                    return { status: 'fulfilled', value: response.data };
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${endpoint}:`, error);
                continue;
            }
        }
        
        return { status: 'rejected', reason: 'No DNS records found' };
    }

    // Function to extract records from DNS response
    function extractRecords(result, recordType) {
        if (result.status === 'rejected' || !result.value) {
            return [];
        }

        const records = [];
        
        // Handle Answer section
        if (result.value.Answer) {
            result.value.Answer.forEach(record => {
                records.push({
                    name: record.name,
                    type: getRecordTypeName(record.type),
                    TTL: record.TTL,
                    data: record.data
                });
            });
        }
        
        // Handle Authority section for NS records
        if (recordType === 'NS' && result.value.Authority) {
            result.value.Authority.forEach(record => {
                if (record.type === 2) { // NS record type
                    records.push({
                        name: record.name,
                        type: 'NS',
                        TTL: record.TTL,
                        data: record.data
                    });
                }
            });
        }

        return records;
    }

    // Function to convert DNS record type number to name
    function getRecordTypeName(typeNumber) {
        const types = {
            1: 'A',
            2: 'NS',
            5: 'CNAME',
            15: 'MX',
            16: 'TXT',
            28: 'AAAA'
        };
        return types[typeNumber] || typeNumber.toString();
    }

    // Lookup button event listener
    lookupBtn.addEventListener('click', () => {
        const domain = domainInput.value.trim();
        const recordType = recordTypeSelect.value;
        fetchDNSInfo(domain, recordType);
    });

    // Enter key support
    domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const domain = domainInput.value.trim();
            const recordType = recordTypeSelect.value;
            fetchDNSInfo(domain, recordType);
        }
    });

    // Function to determine registry based on country code
    function getRegistry(countryCode) {
        const registries = {
            'US': 'ARIN',
            'CA': 'ARIN',
            'MX': 'ARIN',
            'TN': 'AFRINIC',
            'ZA': 'AFRINIC',
            'EG': 'AFRINIC',
            'KE': 'AFRINIC',
            'NG': 'AFRINIC',
            'GB': 'RIPE NCC',
            'DE': 'RIPE NCC',
            'FR': 'RIPE NCC',
            'IT': 'RIPE NCC',
            'NL': 'RIPE NCC',
            'ES': 'RIPE NCC',
            'RU': 'RIPE NCC',
            'JP': 'APNIC',
            'CN': 'APNIC',
            'KR': 'APNIC',
            'IN': 'APNIC',
            'AU': 'APNIC',
            'SG': 'APNIC',
            'BR': 'LACNIC',
            'AR': 'LACNIC',
            'CL': 'LACNIC',
            'CO': 'LACNIC',
            'PE': 'LACNIC'
        };
        
        if (!countryCode) return 'UNKNOWN';
        
        // Check African countries for AFRINIC
        const africanCountries = ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'];
        
        if (africanCountries.includes(countryCode)) {
            return 'AFRINIC';
        }
        
        return registries[countryCode] || 'UNKNOWN';
    }

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

    function validateDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            return false;
        }

        // Remove protocol if present (http://, https://, ftp://, etc.)
        domain = domain.replace(/^[a-zA-Z][a-zA-Z\d+\-\.]*:\/\//, '');
        
        // Remove www prefix if present
        domain = domain.replace(/^www\./, '');
        
        // Remove port number if present (e.g., :8080, :3000)
        domain = domain.replace(/:\d+/, '');
        
        // Remove path, query params, and fragments
        domain = domain.split('/')[0].split('?')[0].split('#')[0].trim();
        
        // Update input field with cleaned domain
        if (domainInput) {
            domainInput.value = domain;
        }
        
        // Reject IP addresses (both IPv4 and IPv6)
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;
        
        if (ipv4Regex.test(domain) || ipv6Regex.test(domain)) {
            return false;
        }
        
        // Reject localhost and other non-domain strings
        const localhostRegex = /^localhost$/i;
        const singleWordRegex = /^[a-zA-Z0-9]+$/;
        
        if (localhostRegex.test(domain) || (singleWordRegex.test(domain) && !domain.includes('.'))) {
            return false;
        }
        
        // Strict domain validation - must be a valid domain format
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        
        return domainRegex.test(domain) && 
               domain.length > 0 && 
               domain.length <= 253 &&
               domain.includes('.') && // Must contain at least one dot
               !domain.startsWith('.') && // Cannot start with dot
               !domain.endsWith('.') && // Cannot end with dot
               !domain.includes('..'); // Cannot have consecutive dots
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
            if (!currentDNSData) {
                showToast('No DNS data to export. Please perform a DNS lookup first.');
                return;
            }

            const jsonData = JSON.stringify(currentDNSData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dns-lookup-${currentDNSData.domain || 'unknown'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('DNS JSON file downloaded!', 'success');
        });

        exportTxtBtn.addEventListener('click', () => {
            if (!currentDNSData) {
                showToast('No DNS data to export. Please perform a DNS lookup first.');
                return;
            }

            const dnsData = document.querySelector('.raw-whois-data pre').textContent;
            const blob = new Blob([dnsData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dns-lookup-${currentDNSData.domain || 'unknown'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('DNS text file downloaded!', 'success');
        });

        copyAllBtn.addEventListener('click', async () => {
            if (!currentDNSData) {
                showToast('No DNS data to copy. Please perform a DNS lookup first.');
                return;
            }

            const dnsData = document.querySelector('.raw-whois-data pre').textContent;

            try {
                await navigator.clipboard.writeText(dnsData);
                showToast('DNS data copied to clipboard!', 'success');
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = dnsData;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('DNS data copied to clipboard!', 'success');
            }
        });
    }

    // Initialize copy and export functionality
    setupCopyButtons();
    setupExportButtons();
});
