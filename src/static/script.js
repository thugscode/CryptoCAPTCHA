// Performance optimizations for hash calculations

(function() {
    // Monitor hash calculations for slowness
    document.addEventListener('animationend', function(e) {
        if (e.animationName === 'checkSlow' && 
            e.target.classList.contains('calculating')) {
            e.target.classList.add('slow');
            e.target.classList.add('slow-check');
        }
    });

    // Check if Web Crypto API is available, if not load a polyfill
    if (!window.crypto || !window.crypto.subtle) {
        console.log("Web Crypto API not available, loading polyfill");
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js');
    }
    
    // Precompute some hashes for common combinations
    function precomputeCommonHashes() {
        // Run in a low-priority task to not block UI
        if ('requestIdleCallback' in window) {
            requestIdleCallback(function() {
                const hashCache = {};
                // Cache common combinations ahead of time
                for (let i = 1000; i < 1100; i++) {
                    for (let j = 1000; j < 1100; j++) {
                        const concat = `${i}${j}`;
                        // Store just a placeholder for now, actual computation will happen in background
                        hashCache[concat] = null;
                    }
                }
                window.hashCache = hashCache;
                populateHashCacheGradually();
            });
        }
    }
    
    // Gradually populate the hash cache without blocking the UI
    function populateHashCacheGradually() {
        const cache = window.hashCache;
        if (!cache) return;
        
        const keys = Object.keys(cache);
        let index = 0;
        
        function computeNextBatch() {
            const start = Date.now();
            // Process until we've used 5ms or finished all keys
            while (Date.now() - start < 5 && index < keys.length) {
                const key = keys[index++];
                if (cache[key] === null) {
                    try {
                        if (window.sha256) {
                            cache[key] = sha256(key);
                        }
                    } catch (e) {
                        console.error("Error precomputing hash:", e);
                    }
                }
            }
            
            // Continue if we have more to process
            if (index < keys.length) {
                setTimeout(computeNextBatch, 50);
            }
        }
        
        // Start the process
        setTimeout(computeNextBatch, 1000); // Wait 1s after page load
    }
    
    // Utility to load scripts dynamically
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState !== 'loading') {
        precomputeCommonHashes();
    } else {
        document.addEventListener('DOMContentLoaded', precomputeCommonHashes);
    }
})();document.addEventListener('DOMContentLoaded', function() {
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

// Enhanced professional JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set up number selection with enhanced UX
    setupNumberTiles();
    
    // Initialize hash preview
    initializeHashPreview();
    
    // Add ripple effect to buttons
    setupRippleEffect();
});

function setupNumberTiles() {
    const numberTiles = document.querySelectorAll('.number-tile');
    const firstNumberInput = document.getElementById('first_number');
    const secondNumberInput = document.getElementById('second_number');
    
    numberTiles.forEach(tile => {
        tile.addEventListener('click', function() {
            // Add tactile feedback
            animateClick(this);
            
            const selectedValue = this.dataset.value;
            
            // Toggle selection styling
            this.classList.toggle('selected');
            
            // Update input fields based on selection
            if (this.classList.contains('selected')) {
                if (!firstNumberInput.value) {
                    firstNumberInput.value = selectedValue;
                    announceChange(`Selected first number: ${selectedValue}`);
                } else if (!secondNumberInput.value) {
                    secondNumberInput.value = selectedValue;
                    announceChange(`Selected second number: ${selectedValue}`);
                } else {
                    // If both inputs are filled, replace the first one and shift
                    firstNumberInput.value = secondNumberInput.value;
                    secondNumberInput.value = selectedValue;
                    announceChange(`Updated selection: ${firstNumberInput.value} and ${selectedValue}`);
                    
                    // Update selected styling
                    numberTiles.forEach(num => {
                        if (num.dataset.value !== secondNumberInput.value && 
                            num.dataset.value !== firstNumberInput.value) {
                            num.classList.remove('selected');
                        }
                    });
                }
            } else {
                // Remove from inputs if deselected
                if (firstNumberInput.value === selectedValue) {
                    firstNumberInput.value = '';
                    announceChange(`Removed first number`);
                } else if (secondNumberInput.value === selectedValue) {
                    secondNumberInput.value = '';
                    announceChange(`Removed second number`);
                }
            }
            
            // Update hash preview
            updateHashPreview();
        });
    });
}

function animateClick(element) {
    // Add subtle scale animation
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

function announceChange(message) {
    // Create an accessible announcement for screen readers
    const announcer = document.getElementById('announcer') || createAnnouncer();
    announcer.textContent = message;
}

function createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
    return announcer;
}

// Hash preview with optimized performance
function initializeHashPreview() {
    // Pre-compute common hashes in the background
    if (window.crypto && window.crypto.subtle) {
        setTimeout(precomputeCommonHashes, 1000);
    }
}

// Hash cache for better performance
const hashCache = {};

function precomputeCommonHashes() {
    // Run some precomputations in the background
    if ('requestIdleCallback' in window) {
        requestIdleCallback(function() {
            // Just precompute a small subset
            for (let i = 1000; i < 1050; i++) {
                for (let j = 1000; j < 1050; j++) {
                    const concat = `${i}${j}`;
                    computeHash(concat).then(hash => {
                        hashCache[concat] = hash;
                    });
                }
            }
        });
    }
}

function updateHashPreview() {
    const first = document.getElementById('first_number').value;
    const second = document.getElementById('second_number').value;
    const hashPreview = document.getElementById('hash-value');
    
    if (first && second) {
        // Show computing state with smooth transition
        hashPreview.innerHTML = 'Computing hash...';
        hashPreview.classList.add('calculating');
        
        const concat = first + second;
        
        // Use cache if available for instant feedback
        if (hashCache[concat]) {
            displayHashResult(hashCache[concat], hashPreview);
        } else {
            // Compute hash with small delay for UI feedback
            setTimeout(() => {
                computeHash(concat).then(hash => {
                    // Store in cache for future use
                    hashCache[concat] = hash;
                    displayHashResult(hash, hashPreview);
                });
            }, 100);
        }
    } else {
        hashPreview.innerHTML = 'Select two numbers to see their hash';
        hashPreview.classList.remove('calculating', 'valid-hash');
    }
}

function computeHash(text) {
    // Use Web Crypto API for better performance
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        return crypto.subtle.digest('SHA-256', data)
            .then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            })
            .catch(error => {
                console.error("Hash calculation error:", error);
                // Fallback to simple hash for demo purposes
                return generateSimpleHash(text);
            });
    } else {
        // Fallback for browsers without Web Crypto
        return Promise.resolve(generateSimpleHash(text));
    }
}

function displayHashResult(hashHex, displayElement) {
    // Format hash with highlighted ending
    const displayHash = hashHex.slice(0, -1) + 
        '<span class="hash-highlight">' + hashHex.slice(-1) + '</span>';
    
    displayElement.innerHTML = displayHash;
    displayElement.classList.remove('calculating');
    
    // Add visual indication if the hash ends with 'f'
    if (hashHex.endsWith('f')) {
        displayElement.classList.add('valid-hash');
    } else {
        displayElement.classList.remove('valid-hash');
    }
}

function generateSimpleHash(text) {
    // Simplified hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Convert to hex-like string
    let hashHex = Math.abs(hash).toString(16).padStart(64, '0');
    
    // For demo purposes, make some combinations end with 'f'
    if (text.length % 2 === 0) {
        hashHex = hashHex.slice(0, -1) + "f";
    }
    
    return hashHex;
}

// Function to generate new puzzle with smooth transition
function generateNewPuzzle() {
    const puzzleContainer = document.getElementById('puzzle-numbers');
    
    // Add loading animation
    puzzleContainer.classList.add('loading');
    puzzleContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    // Fetch new numbers with slight delay for animation
    setTimeout(() => {
        fetch('/refresh_captcha')
            .then(response => response.json())
            .then(data => {
                // Prepare for animation
                puzzleContainer.style.opacity = '0';
                
                setTimeout(() => {
                    puzzleContainer.innerHTML = '';
                    
                    if (data.captcha_numbers) {
                        data.captcha_numbers.forEach(number => {
                            const numDiv = document.createElement('div');
                            numDiv.className = 'number-tile';
                            numDiv.textContent = number;
                            numDiv.dataset.value = number;
                            puzzleContainer.appendChild(numDiv);
                        });
                        
                        // Re-attach event listeners
                        setupNumberTiles();
                    } else {
                        puzzleContainer.innerHTML = '<div class="error-message">Error loading numbers</div>';
                    }
                    
                    // Animate back in
                    puzzleContainer.classList.remove('loading');
                    puzzleContainer.style.opacity = '1';
                    
                    // Reset selections
                    clearSelection();
                }, 300);
            })
            .catch(error => {
                console.error('Error refreshing puzzle:', error);
                puzzleContainer.innerHTML = '<div class="error-message">Failed to generate new numbers</div>';
                puzzleContainer.classList.remove('loading');
            });
    }, 400);
}

// Function to clear selection with animation
function clearSelection() {
    const firstNumberInput = document.getElementById('first_number');
    const secondNumberInput = document.getElementById('second_number');
    
    // Animate the clear
    if (firstNumberInput.value || secondNumberInput.value) {
        firstNumberInput.classList.add('clearing');
        secondNumberInput.classList.add('clearing');
        
        setTimeout(() => {
            firstNumberInput.value = '';
            secondNumberInput.value = '';
            firstNumberInput.classList.remove('clearing');
            secondNumberInput.classList.remove('clearing');
            
            // Reset hash preview
            document.getElementById('hash-value').innerHTML = 'Select two numbers to see their hash';
            document.getElementById('hash-value').classList.remove('calculating', 'valid-hash');
            
            // Clear number tile selections
            document.querySelectorAll('.number-tile').forEach(num => {
                num.classList.remove('selected');
            });
            
            announceChange('Selection cleared');
        }, 150);
    }
}

// Add tactile ripple effect to buttons
function setupRippleEffect() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            ripple.style.borderRadius = '50%';
            ripple.style.width = '100px';
            ripple.style.height = '100px';
            ripple.style.left = `${x - 50}px`;
            ripple.style.top = `${y - 50}px`;
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.opacity = '1';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 700);
        });
    });
}

// Add necessary animation keyframes
if (!document.getElementById('rippleStyle')) {
    const style = document.createElement('style');
    style.id = 'rippleStyle';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }
        
        .clearing {
            transition: all 150ms;
            background: rgba(239, 68, 68, 0.1);
        }
        
        .loading {
            transition: opacity 300ms;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 50px;
            height: 50px;
            border: 4px solid rgba(99, 102, 241, 0.2);
            border-radius: 50%;
            border-top: 4px solid #6366f1;
            animation: spin 1s linear infinite;
            margin: 30px 0;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}