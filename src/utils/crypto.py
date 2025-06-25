def hash_numbers(num1, num2):
    import hashlib
    concatenated = f"{num1}{num2}".encode()
    return hashlib.sha256(concatenated).hexdigest()

def generate_hmac(secret_key, message):
    import hmac
    import hashlib
    return hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest()

# If you have any utility functions for validating hashes

def is_valid_hash_solution(first_number, second_number):
    """Check if the hash of two concatenated numbers ends with 'f'"""
    import hashlib
    concat = f"{first_number}{second_number}"
    hash_result = hashlib.sha256(concat.encode()).hexdigest()
    return hash_result.endswith('f')  # Changed from 'ff' to 'f'