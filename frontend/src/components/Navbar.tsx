import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Healthcare Analyzer
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/drug-analysis"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
            >
              Drug Analysis
            </Link>
            <Link
              to="/symptom-analysis"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
            >
              Symptom Analysis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 