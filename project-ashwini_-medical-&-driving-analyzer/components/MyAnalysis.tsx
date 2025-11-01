import React from 'react';
import { AnalysisResult } from '../types';

interface MyAnalysisProps {
  analyses: AnalysisResult[];
}

const MyAnalysis: React.FC<MyAnalysisProps> = ({ analyses }) => {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-bold mb-6 text-brand-text-dark text-center">My Past Analyses</h2>
      {analyses.length === 0 ? (
        <div className="text-center p-8 bg-brand-bg-light rounded-lg border border-gray-200 max-w-lg mx-auto">
          <p className="text-gray-600">You haven't analyzed any reports yet. Go to the 'Medical Analysis' tab to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyses.map((analysis, index) => (
            <div 
              key={index} 
              className="bg-brand-bg rounded-lg p-6 border border-gray-200 shadow-sm transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="text-xl font-bold text-brand-primary">Analysis #{analyses.length - index}</h3>
                  <div className="flex flex-shrink-0 gap-2">
                    {analysis.reportType && (
                      <span className="bg-brand-primary/20 text-brand-primary text-xs font-medium px-2.5 py-0.5 rounded-full">{analysis.reportType}</span>
                    )}
                    {analysis.language && (
                      <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">{analysis.language}</span>
                    )}
                  </div>
                </div>

                {analysis.summary && <p className="mb-4 italic text-gray-600">"{analysis.summary}"</p>}
                {analysis.resultsBreakdown?.length > 0 && (
                  <div className="mt-auto">
                    <h4 className="font-semibold mb-2 text-brand-text-dark">Key Results:</h4>
                    <ul className="list-disc pl-6 text-brand-text-dark">
                      {analysis.resultsBreakdown.slice(0, 3).map((item: any, i: number) => ( // Show first 3
                        <li key={i}>
                          {item.testName}: {item.result}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAnalysis;