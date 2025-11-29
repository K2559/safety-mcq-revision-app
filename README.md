<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Project Structure

The question file is located in `public/Question/Safety Quiz Question 2022.txt`. Files in the `public` folder are automatically copied to the build output and served as static assets.

## Deploy to GitHub Pages

The app is configured to deploy to GitHub Pages automatically via GitHub Actions when you push to the main branch. The deployment workflow is defined in `.github/workflows/deploy.yml`.
