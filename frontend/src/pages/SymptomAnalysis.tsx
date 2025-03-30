import { useState } from 'react';
import axios from 'axios';

interface AlternativeDiagnosis {
  condition: string;
  similarity_score: number;
  matching_symptoms: string[];
}

interface AnalysisResult {
  current_diagnosis: string;
  symptoms: string[];
  potential_alternatives: AlternativeDiagnosis[];
}

const SymptomAnalysis = () => {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleSubmit = async () => {
    if (!symptoms.length || !diagnosis) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/analyze-symptoms', {
        symptoms,
        diagnosis,
        medications: [], // Empty array as we're only analyzing symptoms
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      alert('Error analyzing symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Symptom Analysis
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Current Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter current diagnosis"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Symptoms
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Enter symptom"
            />
            <button
              onClick={handleAddSymptom}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <ul className="list-disc list-inside">
            {symptoms.map((symptom, index) => (
              <li key={index} className="text-gray-600">
                {symptom}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
      </div>

      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Current Diagnosis
            </h3>
            <p className="text-gray-600">{results.current_diagnosis}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Reported Symptoms
            </h3>
            <ul className="list-disc list-inside">
              {results.symptoms.map((symptom, index) => (
                <li key={index} className="text-gray-600">
                  {symptom}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Potential Alternative Diagnoses
            </h3>
            <div className="space-y-6">
              {results.potential_alternatives.map((alt, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{alt.condition}</h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {Math.round(alt.similarity_score * 100)}% match
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      Matching Symptoms:
                    </h5>
                    <ul className="list-disc list-inside">
                      {alt.matching_symptoms.map((symptom, idx) => (
                        <li key={idx} className="text-gray-600">
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomAnalysis; 