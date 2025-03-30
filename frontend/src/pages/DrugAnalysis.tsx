import { useState } from 'react';
import axios from 'axios';

interface DrugInfo {
  brand_name: string;
  warnings: string[];
  contraindications: string[];
}

interface Conflict {
  drug1: string;
  drug2: string;
  type: string;
  details: string[];
}

const DrugAnalysis = () => {
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [results, setResults] = useState<{
    drug_infos: DrugInfo[];
    conflicts: Conflict[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleSubmit = async () => {
    if (!medications.length || !diagnosis || !symptoms.length) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/analyze-drugs', {
        medications,
        diagnosis,
        symptoms,
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing drugs:', error);
      alert('Error analyzing drugs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Drug Interaction Analysis
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Medications
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Enter medication name"
            />
            <button
              onClick={handleAddMedication}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <ul className="list-disc list-inside">
            {medications.map((med, index) => (
              <li key={index} className="text-gray-600">
                {med}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Diagnosis
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
          {isLoading ? 'Analyzing...' : 'Analyze Drugs'}
        </button>
      </div>

      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>

          {results.conflicts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-red-600 mb-4">
                Potential Conflicts Found
              </h3>
              <ul className="space-y-4">
                {results.conflicts.map((conflict, index) => (
                  <li key={index} className="border-l-4 border-red-500 pl-4">
                    <p className="font-semibold">
                      {conflict.drug1} ↔ {conflict.drug2}
                    </p>
                    <p className="text-gray-600">
                      Type: {conflict.type}
                    </p>
                    <ul className="list-disc list-inside mt-2">
                      {conflict.details.map((detail, idx) => (
                        <li key={idx} className="text-gray-600">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Drug Information
            </h3>
            <div className="space-y-6">
              {results.drug_infos.map((drug, index) => (
                <div key={index} className="border rounded p-4">
                  <h4 className="font-semibold text-lg mb-2">{drug.brand_name}</h4>
                  {drug.warnings.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-yellow-600">Warnings:</h5>
                      <ul className="list-disc list-inside">
                        {drug.warnings.map((warning, idx) => (
                          <li key={idx} className="text-gray-600">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {drug.contraindications.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-600">Contraindications:</h5>
                      <ul className="list-disc list-inside">
                        {drug.contraindications.map((contra, idx) => (
                          <li key={idx} className="text-gray-600">
                            {contra}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugAnalysis; 