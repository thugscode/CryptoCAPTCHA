# README.md

# CAPTCHA as a Cryptographic Puzzle Solver

This project is a Flask web application that allows users to solve a CAPTCHA that doubles as a cryptographic puzzle. The application generates a CAPTCHA image displaying three random numbers and challenges the user to select two numbers whose SHA-256 hash (of their concatenation) ends with 'ff'. Upon successful validation, an HMAC token is generated as proof of solution.

## Project Structure

```
captcha-puzzle-app
├── src
│   ├── app.py                # Main entry point of the Flask application
│   ├── templates             # HTML templates for the application
│   │   ├── base.html         # Base template with common structure
│   │   ├── index.html        # Main page for CAPTCHA and input
│   │   └── result.html       # Result page displaying validation outcome
│   ├── static                # Static files such as CSS
│   │   └── styles.css        # CSS styles for the application
│   ├── utils                 # Utility functions for CAPTCHA and cryptography
│   │   ├── __init__.py       # Marks the utils directory as a Python package
│   │   ├── captcha.py        # Functions for generating CAPTCHA images
│   │   └── crypto.py         # Functions for hashing and HMAC generation
│   └── config.py             # Configuration settings for the Flask app
├── requirements.txt          # Project dependencies
├── .env                      # Environment variables
├── .gitignore                # Files to ignore in Git
└── README.md                 # Project documentation
```

## Requirements

To run this project, you need to have the following dependencies installed:

- Flask
- Pillow
- Any other necessary libraries listed in `requirements.txt`

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd captcha-puzzle-app
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables in the `.env` file as needed.

4. Run the application:
   ```
   python src/app.py
   ```

5. Open your web browser and navigate to `http://127.0.0.1:5000` to access the application.

## Usage

- The main page will display a CAPTCHA image with three random numbers.
- Select two numbers and submit your choice.
- The application will validate your input and display the result along with the generated HMAC token if the solution is correct.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.