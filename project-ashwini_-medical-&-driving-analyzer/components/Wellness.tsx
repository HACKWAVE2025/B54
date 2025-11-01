import React, { useState } from 'react';
import { getWellnessTip } from '../services/geminiService';

type WellnessCategory = 'Recipe' | 'Workout' | 'Mindfulness';

const Wellness: React.FC = () => {
    const [tip, setTip] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<WellnessCategory | null>(null);

    const handleGetTip = async (category: WellnessCategory) => {
        setIsLoading(true);
        setError(null);
        setTip(null);
        setActiveCategory(category);

        try {
            const response = await getWellnessTip(category);
            setTip(response.text);
        } catch (e) {
            console.error(e);
            setError('Sorry, I was unable to fetch a wellness tip. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const CategoryButton: React.FC<{
        category: WellnessCategory,
        // FIX: Changed JSX.Element to React.ReactNode to resolve namespace error.
        icon: React.ReactNode
    }> = ({ category, icon }) => (
        <button
            onClick={() => handleGetTip(category)}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center p-4 space-y-2 font-medium text-brand-text-dark bg-white border-2 rounded-lg shadow-sm transition-all duration-200 ease-in-out
                ${isLoading ? 'cursor-not-allowed opacity-60' : 'hover:border-brand-primary hover:shadow-md hover:-translate-y-1'}
                ${activeCategory === category ? 'border-brand-primary' : 'border-gray-200'}`}
        >
            {icon}
            <span>{category}</span>
        </button>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8 h-64">
                    <svg className="animate-spin h-8 w-8 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-brand-text-dark">Generating your {activeCategory} tip...</p>
                </div>
            );
        }

        if (error) {
            return <p className="text-center text-red-500 p-8">{error}</p>;
        }

        if (tip) {
            return (
                <div className="prose max-w-none p-6 bg-white rounded-lg border border-gray-200 animate-fade-in-up">
                    <h3 className="text-2xl font-bold text-brand-primary mb-4">Your AI Wellness Tip</h3>
                    <div dangerouslySetInnerHTML={{ __html: tip.replace(/\n/g, '<br />') }} />
                </div>
            );
        }

        return (
            <div className="text-center p-8 h-64 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-brand-text-dark">Welcome to the Wellness Corner</h3>
                <p className="text-gray-600 mt-2">Select a category above to get a personalized wellness tip from our AI.</p>
            </div>
        );
    };

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-brand-text-dark text-center">AI-Powered Wellness Corner</h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <CategoryButton
                    category="Recipe"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                />
                <CategoryButton
                    category="Workout"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <CategoryButton
                    category="Mindfulness"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            <div className="bg-brand-bg-light rounded-lg">
                {renderContent()}
            </div>
        </div>
    );
};

export default Wellness;
