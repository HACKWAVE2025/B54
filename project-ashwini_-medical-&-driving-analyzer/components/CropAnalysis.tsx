import React, { useState, useRef } from 'react';
import { analyzeCrop } from '../services/geminiService';
import { CropAnalysisResult } from '../types';

const CropAnalysis: React.FC = () => {
  const [description, setDescription] = useState('');
  const [cropPartType, setCropPartType] = useState('Leaf');
  const [language, setLanguage] = useState('English');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] = useState<CropAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File | undefined) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
        setImageFile(null);
        setImageBase64(null);
        setImageMimeType(null);
        return;
      }
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = reader.result as string;
        const base64String = resultString.split(',')[1];
        setImageBase64(base64String);
        setImageMimeType(file.type);
      };
      reader.onerror = () => {
        setError("Failed to read the file. Please try again.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };


  const handleAnalyze = async () => {
    if (!imageFile) {
      setError('Please upload an image of the crop.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const imagePayload = imageBase64 && imageMimeType ? { data: imageBase64, mimeType: imageMimeType } : undefined;
      if (!imagePayload) {
          throw new Error("Image data is not available.");
      }

      const response = await analyzeCrop(description, cropPartType, language, imagePayload);
      let jsonText = response.text;

      // Robust JSON parsing
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].trim();
      }

      const result = JSON.parse(jsonText);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError('Failed to analyze the crop. The AI response may be malformed or a network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up grid md:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col p-2">
        <h2 className="text-2xl font-bold mb-4 text-brand-text-dark">Analyze Crop Health</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="cropPartType" className="block text-sm font-medium text-gray-600 mb-2">Part to Analyze</label>
                <select
                  id="cropPartType"
                  value={cropPartType}
                  onChange={(e) => setCropPartType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-brand-text-dark rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option>Leaf</option>
                  <option>Stem</option>
                  <option>Fruit</option>
                  <option>Soil</option>
                </select>
            </div>
            <div>
                 <label htmlFor="language" className="block text-sm font-medium text-gray-600 mb-2">Language</label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-brand-text-dark rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Telugu</option>
                </select>
            </div>
        </div>
        
        <div className="my-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Upload Crop Image (Required)</label>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors
                    ${isDragging ? 'border-green-500 bg-green-50' : ''}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="space-y-1 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                        {imageFile ? <span className="font-semibold">{imageFile.name}</span> : "Drag & drop a crop image here"}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-medium text-green-600 bg-green-600/10 hover:bg-green-600/20 px-4 py-2 rounded-md transition-colors"
                        >
                            Or Browse Files
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-2">Add Description (Optional)</label>
        <textarea
          id="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., 'Yellow spots appearing on older leaves', 'The soil is very dry and crumbly'"
          className="w-full bg-gray-50 border border-gray-300 text-brand-text-dark rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />

        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Crop'}
        </button>
      </div>
      <div className="bg-brand-bg-light p-4 md:p-6 rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-brand-text-dark">Analysis Result</h2>
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {analysis && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg text-green-700 mb-2">Farmer-Friendly Summary</h3>
              <p className="text-brand-text-dark bg-green-50 p-3 rounded-md border border-green-200">{analysis.summary}</p>
            </div>

            {analysis.potentialDiseases?.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-green-700 mb-2">Potential Diseases</h3>
                <div className="space-y-3">
                  {analysis.potentialDiseases.map((disease, index) => (
                    <div key={index} className="bg-gray-100 p-3 rounded-md">
                      <strong className="block text-brand-text-dark">{disease.name}</strong>
                      <span className="text-sm text-gray-600">{disease.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.fertilizerSuggestions?.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-green-700 mb-2">Fertilizer Suggestions</h3>
                <div className="space-y-3">
                  {analysis.fertilizerSuggestions.map((fert, index) => (
                     <div key={index} className="bg-gray-100 p-3 rounded-md">
                      <strong className="block text-brand-text-dark">{fert.name}</strong>
                      <span className="text-sm text-gray-600">{fert.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.pesticideSuggestions?.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-green-700 mb-2">Pesticide Suggestions</h3>
                 <div className="space-y-3">
                  {analysis.pesticideSuggestions.map((pest, index) => (
                     <div key={index} className="bg-gray-100 p-3 rounded-md">
                      <strong className="block text-brand-text-dark">{pest.name}</strong>
                      <span className="text-sm text-gray-600">{pest.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
             <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                    Disclaimer: This is an AI-generated analysis. For a definitive diagnosis and treatment plan, please consult a local agricultural expert.
                </p>
             </div>
          </div>
        )}
        {!isLoading && !analysis && !error && (
          <div className="text-center text-gray-500 h-full flex items-center justify-center">
            <p>Your crop analysis results will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropAnalysis;