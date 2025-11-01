import React, { useState, useCallback } from 'react';
import { getOrganInformation } from '../services/geminiService';
import HumanBody from './HumanBody';

interface OrganDetails {
  relatedTests: string[];
  relatedDiseases: {
    name: string;
    symptoms: string[];
  }[];
}

// A reusable, nestable Accordion component
const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; isNested?: boolean }> = ({ title, children, defaultOpen = false, isNested = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const baseHeaderClasses = "flex items-center justify-between w-full font-medium text-left transition-colors duration-300";
    const headerClasses = isNested
        ? `${baseHeaderClasses} p-3 text-brand-text-dark bg-gray-100 hover:bg-gray-200 rounded-md`
        : `${baseHeaderClasses} p-4 text-lg text-brand-primary`;

    const contentClasses = isNested
        ? "p-3 mt-1 bg-gray-50 rounded-md"
        : "p-4 border-t border-gray-200";

    return (
        <div className={!isNested ? "border border-gray-200 rounded-lg overflow-hidden bg-brand-bg" : ""}>
            <h3 className="w-full">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={headerClasses}
                    aria-expanded={isOpen}
                >
                    <span>{title}</span>
                    <svg
                        className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                    >
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                </button>
            </h3>
            {isOpen && (
                <div className={contentClasses}>
                    {children}
                </div>
            )}
        </div>
    );
};

const Learn: React.FC = () => {
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [organInfo, setOrganInfo] = useState<OrganDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrganClick = useCallback(async (organ: string) => {
    if (isLoading && organ === selectedOrgan) return;
    
    setSelectedOrgan(organ);
    setIsLoading(true);
    setError(null);
    setOrganInfo(null);
    
    try {
      const response = await getOrganInformation(organ);
      let jsonText = response.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
      }
      const data: OrganDetails = JSON.parse(jsonText);
      setOrganInfo(data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedOrgan]);

  const InfoPanel: React.FC = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="animate-spin h-8 w-8 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-brand-text-dark">Fetching details for the {selectedOrgan}...</p>
        </div>
      );
    }
    
    if (error) {
         return (
             <div className="flex items-center justify-center h-full text-center p-8">
                 <p className="text-red-500">{error}</p>
             </div>
         );
    }

    if (organInfo && selectedOrgan) {
      return (
        <div className="p-2 md:p-6 h-full overflow-y-auto">
          <h2 className="text-3xl font-bold text-brand-primary mb-4">
            Details for the {selectedOrgan}
          </h2>
          <div className="space-y-4">
            <Accordion title="Related Tests" defaultOpen={true}>
              <ul className="list-disc pl-5 text-brand-text-dark space-y-2">
                {organInfo.relatedTests.map((test, i) => (
                  <li key={i}>{test}</li>
                ))}
              </ul>
            </Accordion>
            
            <Accordion title="Related Diseases" defaultOpen={true}>
              <div className="space-y-2">
                {organInfo.relatedDiseases.map((disease, i) => (
                  <Accordion key={i} title={disease.name} isNested={true}>
                    <h4 className="font-semibold mb-2 text-gray-600">Common Symptoms:</h4>
                    <ul className="list-disc pl-5 text-brand-text-dark space-y-1">
                      {disease.symptoms.map((symptom, j) => (
                        <li key={j}>{symptom}</li>
                      ))}
                    </ul>
                  </Accordion>
                ))}
              </div>
            </Accordion>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-dark">Select an Organ</h2>
          <p className="text-gray-600 mt-2">Click on an organ to see related tests and diseases.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up grid md:grid-cols-2 gap-8 h-full">
      <div className="bg-brand-bg-light rounded-lg flex items-center justify-center p-4">
        <HumanBody onOrganClick={handleOrganClick} selectedOrgan={selectedOrgan} />
      </div>
      <div className="bg-brand-bg-light rounded-lg overflow-hidden">
        <InfoPanel />
      </div>
    </div>
  );
};

export default Learn;