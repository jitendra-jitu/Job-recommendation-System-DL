import logging
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from service.resume_parser import ResumeParsingService
from load.jobs_data import sample_jobs
from service.calculate_match_score import calculate_match_score

from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows all domains to access the API

resume_parser = ResumeParsingService()

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload-resume', methods=['POST'])
def upload_resume():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        parsed_data = resume_parser.parse_resume(file_path)
        os.remove(file_path)

        # Construct response in the specified order
        return jsonify({
            "full_name": parsed_data.full_name,
            "email": parsed_data.email,
            "skills": parsed_data.skills,
            "experience": parsed_data.experience,
            "education": parsed_data.education,
            "career_goals": parsed_data.career_goals
        })

    except Exception as e:
        logging.error(f"Error in /upload-resume: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        job_title = data.get('job_title', '')
        key_skills = data.get('key_skills', '')

        combined_input = f"{job_title}|{key_skills}"

        recommendations = predict_jobs_from_sample(combined_input)

        # Filter out jobs with confidence == 0
        filtered_recommendations = [
            {
                "Job Title": job["Job Title"],
                "Key Skills": job["Key Skills"],
                "confidence": job["confidence"],
                "details": {k: v for k, v in job.items() if k not in ['Job Title', 'Key Skills']}
            }
            for job in recommendations if job["confidence"] > 0
        ]

        return jsonify(filtered_recommendations)

    except Exception as e:
        logging.error(f"Error in /predict: {str(e)}")
        return jsonify({'error': str(e)}), 500


def predict_jobs_from_sample(input_text, top_n=10):
    input_skills = input_text.replace(',', '|').replace(' ', '|')

    scored_jobs = []
    for job in sample_jobs:
        score = calculate_match_score(input_skills, job['Key Skills'])  # Now using calculate_match_score
        job_copy = job.copy()
        job_copy['confidence'] = float(score)
        scored_jobs.append(job_copy)

    sorted_jobs = sorted(scored_jobs, key=lambda x: x['confidence'], reverse=True)
    return sorted_jobs[:top_n]


@app.route('/sample-jobs', methods=['GET'])
def get_sample_jobs():
    return jsonify(sample_jobs)


if __name__ == '__main__':
  app.run(debug=True, port=5000)