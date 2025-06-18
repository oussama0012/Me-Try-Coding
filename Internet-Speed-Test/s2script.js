document.addEventListener('DOMContentLoaded', () => {
    const startTestBtn = document.getElementById('startTestBtn');
    const shareResultsBtn = document.getElementById('shareResultsBtn');
    const progressBar = document.getElementById('progressBar');
    const resultSection = document.getElementById('resultSection');
    
    const downloadInfo = document.getElementById('downloadInfo');
    const uploadInfo = document.getElementById('uploadInfo');
    const pingInfo = document.getElementById('pingInfo');
    const jitterInfo = document.getElementById('jitterInfo');
    
    let chart = null;
    let testInProgress = false;
    let testResults = {
        download: 0,
        upload: 0,
        ping: 0,
        jitter: 0
    };

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

    // Initialize chart
    function initChart() {
        const ctx = document.getElementById('speedChart').getContext('2d');
        
        if (chart) {
            chart.destroy();
        }
        
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Download', 'Upload'],
                datasets: [{
                    label: 'Speed (Mbps)',
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Speed (Mbps)'
                        }
                    }
                }
            }
        });
    }

    // Simulate speed test
    async function runSpeedTest() {
        if (testInProgress) return;
        
        testInProgress = true;
        startTestBtn.disabled = true;
        initChart();
        
        // Reset results
        downloadInfo.textContent = "- Mbps";
        uploadInfo.textContent = "- Mbps";
        pingInfo.textContent = "- ms";
        jitterInfo.textContent = "- ms";
        
        showToast('Speed test started. This will take about 15 seconds.');
        
        try {
            // Define smaller test files for faster results
            const testSizes = [0.5, 1, 2].map(mb => mb * 1024 * 1024); // Test files from 0.5MB to 2MB
            const downloadTestUrls = testSizes.map(size => `https://speed.cloudflare.com/__down?bytes=${size}`);
            
            // Test ping with parallel requests
            await simulateTest(0, 15, 'Testing ping...');
            const pingPromises = Array(3).fill().map(async () => {
                const startPing = performance.now();
                try {
                    await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
                    return performance.now() - startPing;
                } catch (e) {
                    console.error('Ping test failed:', e);
                    return null;
                }
            });
            
            const pingResults = (await Promise.all(pingPromises)).filter(p => p !== null);
            const avgPing = Math.round(pingResults.reduce((a, b) => a + b, 0) / pingResults.length);
            const jitter = Math.round(Math.max(...pingResults) - Math.min(...pingResults));
            
            pingInfo.textContent = `${avgPing} ms`;
            jitterInfo.textContent = `${jitter} ms`;

            // Download speed test with parallel requests
            await simulateTest(15, 60, 'Testing download speed...');
            const downloadPromises = downloadTestUrls.map(async url => {
                try {
                    const startTime = performance.now();
                    const response = await fetch(url, { cache: 'no-store' });
                    const data = await response.blob();
                    const endTime = performance.now();
                    const durationSeconds = (endTime - startTime) / 1000;
                    const bitsLoaded = data.size * 8;
                    return (bitsLoaded / durationSeconds) / 1000000; // Convert to Mbps
                } catch (e) {
                    console.error('Download test failed:', e);
                    return null;
                }
            });

            const downloadSpeeds = (await Promise.all(downloadPromises)).filter(speed => speed !== null);
            const avgDownloadSpeed = downloadSpeeds.reduce((a, b) => a + b, 0) / downloadSpeeds.length;
            
            downloadInfo.textContent = `${avgDownloadSpeed.toFixed(2)} Mbps`;
            chart.data.datasets[0].data[0] = avgDownloadSpeed;
            chart.update();

            // Upload speed test with parallel requests
            await simulateTest(60, 85, 'Testing upload speed...');
            const uploadData = new Blob([new ArrayBuffer(512 * 1024)]); // 512KB test file
            
            const uploadPromises = Array(3).fill().map(async () => {
                try {
                    const startTime = performance.now();
                    const response = await fetch('https://speed.cloudflare.com/__up', {
                        method: 'POST',
                        body: uploadData,
                        cache: 'no-store'
                    });
                    const endTime = performance.now();
                    const durationSeconds = (endTime - startTime) / 1000;
                    const bitsUploaded = uploadData.size * 8;
                    return (bitsUploaded / durationSeconds) / 1000000; // Convert to Mbps
                } catch (e) {
                    console.error('Upload test failed:', e);
                    return null;
                }
            });

            const uploadSpeeds = (await Promise.all(uploadPromises)).filter(speed => speed !== null);
            const avgUploadSpeed = uploadSpeeds.reduce((a, b) => a + b, 0) / uploadSpeeds.length;
            
            uploadInfo.textContent = `${avgUploadSpeed.toFixed(2)} Mbps`;
            chart.data.datasets[0].data[1] = avgUploadSpeed;
            chart.update();

            // Store final results
            testResults = {
                download: avgDownloadSpeed.toFixed(2),
                upload: avgUploadSpeed.toFixed(2),
                ping: avgPing,
                jitter: jitter
            };
            
            showToast('Speed test completed successfully!');
            
        } catch (error) {
            console.error('Speed test failed:', error);
            showToast('Speed test failed. Please try again.');
        } finally {
            startTestBtn.disabled = false;
            testInProgress = false;
            progressBar.style.width = '100%';
            // Reset progress bar after 1 second
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 1000);
        }
    }
    
    // Simulate a part of the test with progress
    function simulateTest(startPercent, endPercent, message) {
        showToast(message);
        return new Promise(resolve => {
            let currentPercent = startPercent;
            const interval = setInterval(() => {
                currentPercent += Math.random() * 2;
                if (currentPercent >= endPercent) {
                    currentPercent = endPercent;
                    clearInterval(interval);
                    resolve();
                }
                progressBar.style.width = `${currentPercent}%`;
            }, 200);
        });
    }

    // Share results
    function shareResults() {
        if (testResults.download === 0) {
            showToast('Please run a speed test first before sharing results.');
            return;
        }
        
        const shareText = `My internet speed test results:
Download: ${testResults.download} Mbps
Upload: ${testResults.upload} Mbps
Ping: ${testResults.ping} ms
Jitter: ${testResults.jitter} ms`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Internet Speed Test Results',
                text: shareText
            }).catch(err => {
                console.error('Share failed:', err);
                copyToClipboard(shareText);
            });
        } else {
            copyToClipboard(shareText);
        }
    }
    
    // Copy text to clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Results copied to clipboard!');
    }

    // Initialize chart on page load
    initChart();
    
    // Event listeners
    startTestBtn.addEventListener('click', runSpeedTest);
    shareResultsBtn.addEventListener('click', shareResults);
});
