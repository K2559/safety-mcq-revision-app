<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Safety MCQ Revision App

An interactive revision tool for construction and industrial safety questions. This app now uses extracted questions from safety training materials in a structured JSON format.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Project Structure

The question file is now located in `public/Question/extracted_questions.json`. This JSON file contains structured safety questions extracted from training materials. Files in the `public` folder are automatically copied to the build output and served as static assets.

### Question Format

The JSON file contains an array of questions with the following structure:
```json
{
  "index": "1.1",
  "question": "Question text in Chinese",
  "options": {
    "a": "Option A text",
    "b": "Option B text", 
    "c": "Option C text"
  },
  "answer": "a"
}
```

## Deploy to GitHub Pages

The app is configured to deploy to GitHub Pages automatically via GitHub Actions when you push to the main branch. The deployment workflow is defined in `.github/workflows/deploy.yml`.
