document.addEventListener('DOMContentLoaded', () => {
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const includeUppercase = document.getElementById('includeUppercase');
    const includeLowercase = document.getElementById('includeLowercase');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const generateBtn = document.getElementById('generateBtn');
    const generatedPassword = document.getElementById('generatedPassword');
    const copyBtn = document.getElementById('copyBtn');
    const resultSection = document.getElementById('resultSection');
    
    const strengthInfo = document.getElementById('strengthInfo');
    const entropyInfo = document.getElementById('entropyInfo');
    const charCountInfo = document.getElementById('charCountInfo');
    const crackTimeInfo = document.getElementById('crackTimeInfo');

    // Character sets
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // Update length display
    lengthSlider.addEventListener('input', () => {
        lengthValue.textContent = lengthSlider.value;
    });

    // Function to show toast notification
    function showToast(message, type = 'success') {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${type === 'success' ? 
                    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline>' :
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

    // Generate secure random password
    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        let availableChars = '';
        
        // Build character set based on selected options
        if (includeUppercase.checked) availableChars += charSets.uppercase;
        if (includeLowercase.checked) availableChars += charSets.lowercase;
        if (includeNumbers.checked) availableChars += charSets.numbers;
        if (includeSymbols.checked) availableChars += charSets.symbols;
        
        // Validate at least one character set is selected
        if (availableChars === '') {
            showToast('Please select at least one character type', 'error');
            return;
        }
        
        // Generate password using crypto.getRandomValues for security
        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        
        for (let i = 0; i < length; i++) {
            password += availableChars[array[i] % availableChars.length];
        }
        
        return password;
    }
    
    // Calculate password strength and entropy
    function analyzePassword(password) {
        if (!password) return;
        
        const length = password.length;
        let charsetSize = 0;
        
        // Calculate charset size
        if (/[a-z]/.test(password)) charsetSize += 26;
        if (/[A-Z]/.test(password)) charsetSize += 26;
        if (/[0-9]/.test(password)) charsetSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
        
        // Calculate entropy (log2(charsetSize^length))
        const entropy = Math.log2(Math.pow(charsetSize, length));
        
        // Determine strength
        let strength = 'Very Weak';
        if (entropy >= 60) strength = 'Very Strong';
        else if (entropy >= 45) strength = 'Strong';
        else if (entropy >= 30) strength = 'Good';
        else if (entropy >= 20) strength = 'Fair';
        else if (entropy >= 10) strength = 'Weak';
        
        // Calculate crack time (assuming 1 billion guesses per second)
        const possibleCombinations = Math.pow(charsetSize, length);
        const secondsToCrack = possibleCombinations / (2 * 1000000000); // Average time, 1B guesses/sec
        
        let crackTime = 'Instantly';
        if (secondsToCrack > 31536000000) { // > 1000 years
            crackTime = 'Centuries';
        } else if (secondsToCrack > 31536000) { // > 1 year
            crackTime = `${Math.round(secondsToCrack / 31536000)} years`;
        } else if (secondsToCrack > 86400) { // > 1 day
            crackTime = `${Math.round(secondsToCrack / 86400)} days`;
        } else if (secondsToCrack > 3600) { // > 1 hour
            crackTime = `${Math.round(secondsToCrack / 3600)} hours`;
        } else if (secondsToCrack > 60) { // > 1 minute
            crackTime = `${Math.round(secondsToCrack / 60)} minutes`;
        } else if (secondsToCrack > 1) {
            crackTime = `${Math.round(secondsToCrack)} seconds`;
        }
        
        return {
            strength,
            entropy: Math.round(entropy),
            crackTime,
            length
        };
    }
    
    // Update result display
    function updateResults(password) {
        const analysis = analyzePassword(password);
        
        strengthInfo.innerHTML = `
            <strong>Level:</strong> ${analysis.strength}<br>
            <strong>Score:</strong> ${analysis.entropy >= 60 ? '5/5' : analysis.entropy >= 45 ? '4/5' : analysis.entropy >= 30 ? '3/5' : analysis.entropy >= 20 ? '2/5' : '1/5'}
        `;
        
        entropyInfo.innerHTML = `
            <strong>Bits:</strong> ${analysis.entropy}<br>
            <strong>Randomness:</strong> ${analysis.entropy >= 60 ? 'Excellent' : analysis.entropy >= 45 ? 'Very Good' : analysis.entropy >= 30 ? 'Good' : 'Low'}
        `;
        
        charCountInfo.innerHTML = `
            <strong>Total:</strong> ${analysis.length}<br>
            <strong>Complexity:</strong> ${analysis.length >= 16 ? 'High' : analysis.length >= 12 ? 'Medium' : 'Low'}
        `;
        
        crackTimeInfo.innerHTML = `
            <strong>Estimate:</strong> ${analysis.crackTime}<br>
            <strong>Security:</strong> ${analysis.crackTime === 'Centuries' ? 'Maximum' : analysis.crackTime.includes('years') ? 'High' : 'Moderate'}
        `;
    }

    // Generate button event listener
    generateBtn.addEventListener('click', () => {
        const password = generatePassword();
        if (password) {
            generatedPassword.value = password;
            updateResults(password);
        }
    });

    // Copy button event listener
    copyBtn.addEventListener('click', async () => {
        const password = generatedPassword.value;
        if (!password) {
            showToast('Generate a password first!', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(password);
            showToast('Password copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            generatedPassword.select();
            document.execCommand('copy');
            showToast('Password copied to clipboard!', 'success');
        }
    });

    // Generate initial password on page load
    generateBtn.click();
});
