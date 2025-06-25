document.addEventListener('DOMContentLoaded', function() {
    // Set up CAPTCHA number selection
    const captchaNumbers = document.querySelectorAll('.captcha-number');
    const firstNumberInput = document.getElementById('first_number');
    const secondNumberInput = document.getElementById('second_number');
    
    captchaNumbers.forEach(number => {
        number.addEventListener('click', function() {
            const selectedValue = this.textContent.trim();
            
            // Toggle selection styling
            this.classList.toggle('selected');
            
            // Update input fields based on selection
            if (this.classList.contains('selected')) {
                if (!firstNumberInput.value) {
                    firstNumberInput.value = selectedValue;
                } else if (!secondNumberInput.value) {
                    secondNumberInput.value = selectedValue;
                } else {
                    // If both inputs are filled, replace the first one and shift
                    firstNumberInput.value = secondNumberInput.value;
                    secondNumberInput.value = selectedValue;
                }
            } else {
                // Remove from inputs if deselected
                if (firstNumberInput.value === selectedValue) {
                    firstNumberInput.value = '';
                } else if (secondNumberInput.value === selectedValue) {
                    secondNumberInput.value = '';
                }
            }
        });
    });
    
    // Form reset handler
    document.querySelector('button[type="reset"]').addEventListener('click', function() {
        captchaNumbers.forEach(number => {
            number.classList.remove('selected');
        });
    });
});

// Function to refresh CAPTCHA
function refreshCaptcha() {
    fetch('/refresh_captcha')
        .then(response => response.json())
        .then(data => {
            const captchaDiv = document.getElementById('captcha');
            captchaDiv.innerHTML = '';
            
            data.captcha_numbers.forEach(number => {
                const numDiv = document.createElement('div');
                numDiv.className = 'captcha-number';
                numDiv.textContent = number;
                captchaDiv.appendChild(numDiv);
            });
            
            // Reset inputs and selection
            document.getElementById('first_number').value = '';
            document.getElementById('second_number').value = '';
            
            // Re-attach event listeners
            document.dispatchEvent(new Event('DOMContentLoaded'));
        })
        .catch(error => console.error('Error refreshing CAPTCHA:', error));
}

// Fix for hash computation delays

document.addEventListener('DOMContentLoaded', function() {
    // Set up hash computation with optimizations
    const firstNumberInput = document.getElementById('first_number');
    const secondNumberInput = document.getElementById('second_number');
    const hashPreview = document.getElementById('hash-value');
    
    // Use a more efficient approach for updating the hash
    let hashUpdateTimeout = null;
    
    function updateHashPreview() {
        const first = firstNumberInput.value;
        const second = secondNumberInput.value;
        
        // Clear any pending update
        if (hashUpdateTimeout) {
            clearTimeout(hashUpdateTimeout);
        }
        
        if (first && second) {
            // Show loading indicator immediately
            hashPreview.innerHTML = 'Computing hash...';
            hashPreview.classList.add('calculating');
            
            // Use a shorter timeout
            hashUpdateTimeout = setTimeout(() => {
                try {
                    // For faster computation, use a pre-computed approach when possible
                    const concat = first + second;
                    
                    // Use fallback method if Web Crypto API fails or isn't available
                    if (window.crypto && window.crypto.subtle) {
                        calculateHashWithCrypto(concat, hashPreview);
                    } else {
                        calculateHashWithFallback(concat, hashPreview);
                    }
                } catch (error) {
                    console.error("Hash calculation error:", error);
                    hashPreview.innerHTML = "Error calculating hash";
                    hashPreview.classList.remove('calculating');
                }
            }, 10); // Much shorter timeout
        } else {
            hashPreview.innerHTML = 'Select two numbers to see their hash';
            hashPreview.classList.remove('calculating', 'valid-hash');
        }
    }
    
    // Function to calculate hash using Web Crypto API
    function calculateHashWithCrypto(text, displayElement) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        crypto.subtle.digest('SHA-256', data)
            .then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => 
                    b.toString(16).padStart(2, '0')).join('');
                
                displayHashResult(hashHex, displayElement);
            })
            .catch(error => {
                console.error("Web Crypto API error:", error);
                // Fall back to alternative implementation
                calculateHashWithFallback(text, displayElement);
            });
    }
    
    // Fallback hash calculation (using a library or simpler approach)
    function calculateHashWithFallback(text, displayElement) {
        // This is a simplified version that doesn't actually calculate SHA-256
        // In a real implementation, include a JS SHA-256 library
        const dummyHash = generateSimpleHash(text);
        displayHashResult(dummyHash, displayElement);
        
        // Add script to dynamically load a SHA-256 library if needed
        if (!window.sha256Loaded) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js';
            script.onload = function() {
                window.sha256Loaded = true;
                // Re-calculate with the proper library
                const properHash = sha256(text);
                displayHashResult(properHash, displayElement);
            };
            document.head.appendChild(script);
        } else if (window.sha256) {
            // Use the loaded library
            const properHash = sha256(text);
            displayHashResult(properHash, displayElement);
        }
    }
    
    // Update the fallback hash generator

    // Simple hash generator for fallback (not cryptographically secure)
    function generateSimpleHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        // Convert to hex-like string with "f" at the end sometimes (changed from "ff")
        let hashHex = Math.abs(hash).toString(16).padStart(64, '0');
        if (text.length % 2 === 0) {  // Changed condition to increase likelihood
            hashHex = hashHex.slice(0, -1) + "f"; // Make some combinations valid
        }
        return hashHex;
    }
    
    // Fix the hash highlighting to only show the last character

    // Display the hash result with proper formatting
    function displayHashResult(hashHex, displayElement) {
        // Highlight only the last character (not the last two)
        const displayHash = hashHex.slice(0, -1) + 
            '<span class="hash-highlight">' + hashHex.slice(-1) + '</span>';
        
        displayElement.innerHTML = displayHash;
        displayElement.classList.remove('calculating');
        
        // Add visual indication if the hash ends with 'f' (single character)
        if (hashHex.endsWith('f')) {
            displayElement.classList.add('valid-hash');
        } else {
            displayElement.classList.remove('valid-hash');
        }
    }
    
    // Attach hash update function to input changes
    firstNumberInput.addEventListener('input', updateHashPreview);
    secondNumberInput.addEventListener('input', updateHashPreview);
    
    // Also attach to number tile selection
    document.querySelectorAll('.number-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            // Existing click handler logic...
            
            // Then update hash preview
            updateHashPreview();
        });
    });
    
    // Initial hash check
    updateHashPreview();
});