from PIL import Image, ImageDraw, ImageFont
import random
import os

def generate_captcha_numbers(count=3, min_val=1000, max_val=9999):
    """Generate random numbers for the CAPTCHA challenge"""
    return [random.randint(min_val, max_val) for _ in range(count)]

def generate_captcha():
    """Generate a CAPTCHA image with three random numbers"""
    # Define image properties
    width, height = 300, 100
    background_color = (255, 255, 255)  # White
    
    # Generate random numbers
    numbers = generate_captcha_numbers()
    
    # Create image and drawing context
    image = Image.new('RGB', (width, height), background_color)
    draw = ImageDraw.Draw(image)
    
    # Try to get font or use default
    try:
        font_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'fonts', 'arial.ttf')
        if not os.path.exists(font_path):
            # Default system font as fallback
            font = ImageFont.load_default()
        else:
            font = ImageFont.truetype(font_path, 32)
    except Exception:
        font = ImageFont.load_default()
    
    # Draw numbers on the image
    positions = [(50, 35), (150, 35), (250, 35)]
    colors = [(0, 0, 0), (50, 50, 50), (100, 100, 100)]  # Different shades
    
    # Add noise (random dots)
    for _ in range(500):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        draw.point((x, y), fill=(random.randint(0, 200), 
                                  random.randint(0, 200),
                                  random.randint(0, 200)))
    
    # Add numbers
    for i in range(len(numbers)):
        draw.text(positions[i], str(numbers[i]), font=font, fill=colors[i])
    
    # Add some random lines
    for _ in range(5):
        start_x = random.randint(0, width // 3)
        start_y = random.randint(0, height)
        end_x = random.randint(2 * width // 3, width)
        end_y = random.randint(0, height)
        draw.line([(start_x, start_y), (end_x, end_y)], 
                  fill=(random.randint(0, 150), random.randint(0, 150), random.randint(0, 150)),
                  width=2)
    
    return {
        'image': image,
        'numbers': numbers
    }

def create_captcha():
    """Wrapper function that returns the image and numbers"""
    return generate_captcha()