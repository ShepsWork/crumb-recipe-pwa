import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRecipeStore } from '../state/session';
import { db } from '../db';
import { IosNavBar } from '../components/IosNavBar';
import { normalizeRecipeUrl } from '../utils/url';

export default function ImportRecipe() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const addRecipe = useRecipeStore((state) => state.addRecipe);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeRecipeUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || 'Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      const recipe = await db.importRecipe(normalizedUrl);
      await addRecipe(recipe);
      toast.success('Recipe imported!');
      navigate(`/recipe/${recipe.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Import error:', error instanceof Error ? { message: error.message, stack: error.stack } : error);
      toast.error(message || 'Failed to import recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen ios-page">
      <IosNavBar
        title="Import"
        left={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-blueberry font-medium"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[17px]">Back</span>
          </button>
        }
      />

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-5">
        <div className="ios-card p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Link2 className="h-5 w-5 text-blueberry" />
            <h2 className="text-lg font-semibold text-gray-900">Recipe URL</h2>
          </div>
          
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Paste the recipe URL here
              </label>
              <input
                id="url"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://example.com/recipe"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blueberry/20 focus:border-blueberry/30 bg-white/80 text-[17px]"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blueberry text-white py-3 rounded-xl hover:bg-blueberry/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[17px] font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Importing...</span>
                </div>
              ) : (
                'Import Recipe'
              )}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-100/70 rounded-2xl border border-black/5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Supported sites</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Any site with JSON-LD recipe markup</li>
              <li>• Popular cooking sites (AllRecipes, Food Network, etc.)</li>
              <li>• Recipe blogs with structured data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}