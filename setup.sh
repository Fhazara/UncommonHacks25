#!/bin/bash

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
npm install
cd ..

echo "Setup complete! To run the application:"
echo "1. Start the backend server:"
echo "   cd backend"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev" 