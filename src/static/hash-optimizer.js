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
})();