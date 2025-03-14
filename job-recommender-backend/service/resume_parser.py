import logging
import os
import json
import requests
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from typing import List, Dict

# Initialize Flask app
app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class ResumeData:
    """Class to structure parsed resume data."""
    def __init__(self, full_name: str, email: str, skills: List[str], experience: List[Dict], education: List[Dict], career_goals: str):
        self.full_name = full_name
        self.email = email
        self.skills = skills
        self.experience = experience
        self.education = education
        self.career_goals = career_goals

class ResumeParsingService:
    """Service to parse resumes using Google's Gemini API."""
    def __init__(self):
        self.GEMINI_API_KEY = ''  # Replace with a secure way to fetch API key
        self.GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def parse_resume(self, resume_file_path: str) -> ResumeData:
        """Parses the resume and extracts structured data."""
        self.validate_file(resume_file_path)
        extracted_text = self.extract_text_from_pdf(resume_file_path)
        prompt = self.create_analysis_prompt(extracted_text)
        api_response = self.send_to_gemini(prompt)
        return self.parse_gemini_response(api_response)

    def validate_file(self, file_path: str):
        """Checks if the file is valid."""
        if not os.path.exists(file_path):
            raise FileNotFoundError("File not found")
        if os.path.getsize(file_path) == 0:
            raise ValueError("Empty file")

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extracts text from a PDF."""
        reader = PdfReader(file_path)
        return "".join(page.extract_text() for page in reader.pages if page.extract_text())

    def create_analysis_prompt(self, resume_text: str) -> str:
        """Creates a structured prompt for resume analysis."""
        return (
            "Analyze this resume and return a JSON object with the following fields: "
            "'full_name' (string), 'email' (string), 'skills' (array of strings), "
            "'experience' (array of objects with 'job_title', 'company', 'duration'), "
            "'education' (array of objects with 'degree', 'institution', 'year'), "
            "'career_goals' (string). Resume text:\n" + resume_text
        )

    def send_to_gemini(self, prompt: str) -> str:
        """Sends prompt to Gemini API for processing."""
        headers = {"Content-Type": "application/json"}
        data = {"contents": [{"parts": [{"text": prompt}]}]}
        response = requests.post(f"{self.GEMINI_API_URL}?key={self.GEMINI_API_KEY}", headers=headers, json=data)
        if not response.ok:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
        return response.text

    def parse_gemini_response(self, response_json: str) -> ResumeData:
        """Parses the JSON response from Gemini API."""
        response_data = json.loads(response_json)
        content_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
        clean_json = content_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)

        return ResumeData(
            full_name=data.get("full_name", ""),
            email=data.get("email", ""),
            skills=data.get("skills", []),
            experience=data.get("experience", []),
            education=data.get("education", []),
            career_goals=data.get("career_goals", "")
        )

# Initialize ResumeParsingService
resume_parser = ResumeParsingService()

def allowed_file(filename):
    """Checks if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload-resume', methods=['POST'])
def upload_resume():
    """Endpoint to upload and parse a resume."""
    try:
        # Check if file is provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

        # Save the file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Parse the resume
        parsed_data = resume_parser.parse_resume(file_path)

        # Clean up temporary file
        os.remove(file_path)

        # Return structured response
        return jsonify({
            "full_name": parsed_data.full_name,
            "first_name": parsed_data.full_name.split()[0] if parsed_data.full_name else "",
            "email": parsed_data.email,
            "skills": parsed_data.skills,
            "experience": parsed_data.experience,
            "education": parsed_data.education,
            "career_goals": parsed_data.career_goals
        })

    except Exception as e:
        logging.error(f"Error in /upload-resume: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
