import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome to Healthcare Analyzer
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Drug Interaction Analysis
          </h2>
          <p className="text-gray-600 mb-4">
            Analyze potential drug interactions and contraindications using the FDA database.
          </p>
          <Link
            to="/drug-analysis"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Start Analysis
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Symptom Analysis
          </h2>
          <p className="text-gray-600 mb-4">
            Get insights about your symptoms and potential alternative diagnoses.
          </p>
          <Link
            to="/symptom-analysis"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Start Analysis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 