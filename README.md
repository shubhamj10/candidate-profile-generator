# Candidate Profile Generator

Turn a candidate's resume + a job description into a polished, one-page profile slide (PPTX) — automatically, using AI.

Upload a resume PDF and a candidate photo, pick the job title it's being matched against, and the app extracts and synthesizes relevant skills, experience, and industry background into a recruiter-ready bio deck — no manual formatting needed.

## Features

- **AI-powered profile extraction** — Uses Azure OpenAI to read a resume and a stored job description, then generates a structured, JD-relevant summary, skills list, industries, and experience bullets (without fabricating anything not present in the resume).
- **Job description management** — Save and manage job descriptions through a dedicated UI; saved titles populate a dropdown when generating a profile.
- **Automatic PPTX generation** — Outputs a ready-to-share PowerPoint profile slide, downloadable directly from the browser.
- **Photo processing** — Candidate photos are automatically resized/cropped and embedded into the generated slide.
- **Clean, responsive UI** — Built with React + Tailwind CSS, including drag-and-drop file uploads and a live on-screen preview before download.

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS

**Backend**
- Node.js + Express
- MongoDB (Mongoose)
- Azure OpenAI (resume/JD extraction)
- `pdf-parse` — resume text extraction
- `sharp` — image processing
- PPTX generation service (PowerPoint output)

## Project Structure

```
Profile-Creation/
├── Backend/
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── controller/
│   │   │   └── resumeParse.controller.js
│   │   ├── db/
│   │   │   └── db.js
│   │   ├── model/
│   │   │   └── jobDescription.model.js
│   │   ├── route/
│   │   │   └── resume.route.js
│   │   └── services/
│   │       └── pptGeneration.service.js
│   └── .env.example
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ProfileGeneratorForm.jsx
    │   │   └── JobDescriptionForm.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- An Azure OpenAI resource with a deployed model

### 1. Clone the repo
```bash
git clone https://github.com/shubhamj10/candidate-profile-generator.git
cd candidate-profile-generator
```

### 2. Backend setup
```bash
cd Backend
npm install
cp .env.example .env
```
Fill in `.env` with your own values:
```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/candidate-profiles
AZURE_OPENAI_API_KEY=your-actual-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

Run the backend:
```bash
node server.js
```
The API will be available at `http://localhost:3002`.

### 3. Frontend setup
```bash
cd ../Frontend
npm install
cp .env.example .env
```
Fill in `.env`:
```
VITE_API_BASE_URL=http://localhost:3002
```

Run the frontend:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Usage

1. **Add a job description** — Go to the "Job Descriptions" page, enter a title and paste the full JD text, then save.
2. **Generate a profile** — Go to the "Generate Profile" page, select the job title from the dropdown, upload the candidate's resume (PDF) and photo, then click "Generate profile."
3. **Preview & download** — Review the generated profile on screen, then download it as a `.pptx` file.

## API Endpoints

| Method | Endpoint                  | Description                              |
|--------|----------------------------|-------------------------------------------|
| GET    | `/api/Job-Description`     | Fetch all saved job descriptions          |
| POST   | `/api/addJobDescription`   | Save a new job description                |
| POST   | `/api/generateProfile`     | Generate a candidate profile (multipart: `title`, `resume`, `photo`) |

## Roadmap / Possible Improvements

- [ ] Automated testing (Jest) for API endpoints
- [ ] Docker + CI/CD pipeline (build, test, deploy)
- [ ] Redis caching for frequently accessed job descriptions
- [ ] Support editing a generated profile before download
- [ ] Delete/edit saved job descriptions

## Author

**Shubham Jankar**
- GitHub: [@shubhamj10](https://github.com/shubhamj10)

## License

This project is licensed under the terms of the LICENSE file included in this repository.