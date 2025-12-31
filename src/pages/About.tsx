import { useNavigate } from 'react-router-dom';
import { RvHeader } from '../components/RvHeader';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-rvPageBg">
      <RvHeader title="About" showBackArrow onBack={() => navigate('/')} />

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-5">
        <div className="bg-white rounded-xl shadow-rv-card p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Recipe Vault</h2>
          <p className="text-gray-700">
            A refined recipe organizer focusing on clarity, accessibility, and offline reliability.
          </p>
        </div>
      </div>
    </div>
  );
}
