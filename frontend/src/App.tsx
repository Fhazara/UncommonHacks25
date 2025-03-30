import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import DrugAnalysis from './pages/DrugAnalysis';
import SymptomAnalysis from './pages/SymptomAnalysis';

function App() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/drug-analysis" element={<DrugAnalysis />} />
            <Route path="/symptom-analysis" element={<SymptomAnalysis />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 