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