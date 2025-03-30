# Healthcare Drug Interaction Analyzer

A modern web application that helps analyze drug interactions and symptoms to provide better healthcare insights.

## Features

- Drug interaction analysis using FDA API
- Symptom analysis and differential diagnosis
- User-friendly interface for input and results display
- Real-time conflict detection between medications

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   └── tests/        # Backend tests
├── frontend/         # React frontend
└── requirements.txt  # Python dependencies
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/analyze-drugs`: Analyze drug interactions
- `POST /api/analyze-symptoms`: Analyze symptoms and provide differential diagnosis
- `GET /api/drug-info/{drug_name}`: Get detailed information about a specific drug

## Technologies Used

- Backend: FastAPI, SQLAlchemy
- Frontend: React, TypeScript, TailwindCSS
- Database: SQLite
- External APIs: FDA Drug API 