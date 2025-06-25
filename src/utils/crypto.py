def hash_numbers(num1, num2):
    import hashlib
    concatenated = f"{num1}{num2}".encode()
    return hashlib.sha256(concatenated).hexdigest()

def generate_hmac(secret_key, message):
    import hmac
    import hashlib
    return hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest()