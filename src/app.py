from flask import Flask, render_template, request, session, jsonify
import hashlib
import hmac
import random

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Replace with a proper secret key in production

# Generate random numbers for the puzzle
def generate_puzzle_numbers(count=3, min_val=1000, max_val=9999):
    return [random.randint(min_val, max_val) for _ in range(count)]

@app.route('/', methods=['GET', 'POST'])
def index():
    # Generate puzzle numbers
    try:
        puzzle_numbers = generate_puzzle_numbers()
        session['captcha_numbers'] = puzzle_numbers  # Keep session name for compatibility
    except Exception as e:
        print(f"Error generating puzzle numbers: {e}")
        puzzle_numbers = [1234, 5678, 9012]  # Default fallback

    result = None
    
    # Handle form submission
    if request.method == 'POST':
        first_number = request.form.get('first_number')
        second_number = request.form.get('second_number')
        
        if not first_number or not second_number:
            result = {'success': False, 'message': 'Please select two numbers'}
        else:
            # Check if the hash of the concatenated numbers ends with 'f'
            concat = f"{first_number}{second_number}"
            hash_result = hashlib.sha256(concat.encode()).hexdigest()
            
            if hash_result.endswith('f'):  # Single 'f' check
                token = hmac.new(
                    app.secret_key.encode(),
                    concat.encode(),
                    hashlib.sha256
                ).hexdigest()
                result = {'success': True, 'token': token}
            else:
                result = {'success': False, 'message': f'Invalid solution. The hash does not end with "f". Got: {hash_result[-1:]}'}
    
    return render_template('index.html', captcha_numbers=puzzle_numbers, result=result)

@app.route('/refresh_captcha', methods=['GET'])
def refresh_captcha():
    """Generate new puzzle numbers and return as JSON"""
    try:
        puzzle_numbers = generate_puzzle_numbers()
        session['captcha_numbers'] = puzzle_numbers  # Keep session name for compatibility
        
        return jsonify({
            'captcha_numbers': puzzle_numbers
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'captcha_numbers': [1111, 2222, 3333]  # Fallback
        })

if __name__ == '__main__':
    app.run(debug=True)