// Fix: Implement the full App component to resolve module errors.
import React, { useState, useEffect } from 'react';
import { Tab, AnalysisResult } from './types';
import MedicalAnalysis from './components/MedicalAnalysis';
import MyAnalysis from './components/MyAnalysis';
import Learn from './components/Learn';
import Wellness from './components/Wellness';
import DrivingMode from './components/DrivingMode';
import Emergency from './components/Emergency';
import Facilities from './components/Facilities';
import AIAssistant from './components/AIAssistant';
import { sendEmergencyAlert } from './services/twilioService';
import CropAnalysis from './components/CropAnalysis';


interface Toast {
    message: string;
    type: 'success' | 'error';
}

const ToastNotification: React.FC<{ toast: Toast, onDismiss: () => void }> = ({ toast, onDismiss }) => (
    <div className="fixed bottom-5 right-5 bg-white border-l-4 border-brand-primary text-brand-text-dark p-4 rounded-lg shadow-2xl animate-fade-in-up z-50">
        <div className="flex items-center">
            <p className={`${toast.type === 'error' ? 'text-red-500' : 'text-green-600'} mr-4 font-medium`}>{toast.message}</p>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-800 font-bold text-xl">&times;</button>
        </div>
    </div>
);

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'welcome' | 'health' | 'agriculture'>('welcome');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MedicalAnalysis);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const handleNewAnalysis = async (result: AnalysisResult) => {
    setAnalyses(prev => [result, ...prev]);

    if (result.criticalAlert?.toUpperCase() === 'HIGH') {
        let message = '';
        if (result.reportType === 'ECG') {
            message = `CRITICAL ECG ALERT: POTENTIAL HEART ATTACK DETECTED.\nSummary: "${result.summary}"\nThis is a time-sensitive emergency. Please seek immediate medical attention.`;
        } else {
            message = `URGENT MEDICAL ALERT\nReport Type: ${result.reportType}\nSummary: "${result.summary}"\nUrgency: HIGH. Please consult a healthcare provider immediately.`;
        }
        
        const response = await sendEmergencyAlert(emergencyContact, message);

        if (response.success) {
            setToast({ message: 'Emergency SMS sent! Check the "Facilities" tab to find nearby hospitals.', type: 'success' });
        } else {
            setToast({ message: `Failed to send SMS: ${response.error}`, type: 'error' });
        }
        setTimeout(() => setToast(null), 6000);
    }
  };

  const handleDrivingAlert = async () => {
    const message = `DRIVING EMERGENCY: Potential Crash Detection. The user's device detected a loud sound consistent with a vehicle crash. Please check on them immediately.`;
    const response = await sendEmergencyAlert(emergencyContact, message);

    if (response.success) {
        setToast({ message: 'Crash Alert SMS sent! Check the "Facilities" tab for help.', type: 'success' });
        setTimeout(() => setToast(null), 6000);
    }
  };

  const handleManualSOS = async (): Promise<{ success: boolean; error?: string }> => {
    const message = `MANUAL SOS ALERT: The user has triggered an SOS from the app. Please check on them immediately.`;
    const response = await sendEmergencyAlert(emergencyContact, message);

    if (response.success) {
        setToast({ message: 'Emergency SMS sent!', type: 'success' });
    } else {
        setToast({ message: `Failed to send SMS: ${response.error}`, type: 'error' });
    }
    setTimeout(() => setToast(null), 6000);
    return response;
  };
  
  const emergencyContact = "+919154928563"; // Hardcoded contact as requested

  const renderHealthContent = () => {
    switch (activeTab) {
      case Tab.MedicalAnalysis:
        return <MedicalAnalysis onNewAnalysis={handleNewAnalysis} />;
      case Tab.MyAnalysis:
        return <MyAnalysis analyses={analyses} />;
      case Tab.Learn:
        return <Learn />;
      case Tab.Wellness:
        return <Wellness />;
      case Tab.DrivingMode:
        return <DrivingMode onAlert={handleDrivingAlert} />;
      case Tab.Emergency:
        return <Emergency contact={emergencyContact} onSOS={handleManualSOS} />;
      case Tab.Facilities:
        return <Facilities />;
      case Tab.AIAssistant:
        return <AIAssistant />;
      default:
        return null;
    }
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg-light p-4">
        <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-brand-text-dark mb-4">Welcome to Project Ashwini</h1>
            <p className="text-lg md:text-xl text-gray-600">Your AI-Powered Co-Pilot for Health and Agriculture</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Health Card */}
            <div onClick={() => setAppMode('health')} className="cursor-pointer bg-white p-8 rounded-xl shadow-lg border border-transparent hover:border-brand-primary hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-brand-primary mb-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                 </svg>
                <h2 className="text-3xl font-bold text-brand-text-dark mb-2">Ashwini for Health</h2>
                <p className="text-gray-600">Analyze medical reports, get full-body insights, and access emergency safety features.</p>
            </div>
            {/* Agriculture Card */}
            <div onClick={() => setAppMode('agriculture')} className="cursor-pointer bg-white p-8 rounded-xl shadow-lg border border-transparent hover:border-green-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h2 className="text-3xl font-bold text-brand-text-dark mb-2">Ashwini for Agriculture</h2>
                <p className="text-gray-600">Analyze crop health from images, detect diseases, and get expert recommendations for fertilizers and pesticides.</p>
            </div>
        </div>
    </div>
  );

  const AgricultureApp = () => (
    <div>
        <div className="relative text-white overflow-hidden">
            <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492944549502-953e9cde8b71?q=80&w=2070&auto=format&fit=crop')" }}
            ></div>
            <div className="absolute inset-0 bg-green-800 opacity-80"></div>
            <div className="relative z-10">
                 <header className="container mx-auto">
                    <div className="flex justify-between items-center p-4">
                        <div className="text-2xl font-bold flex items-center gap-4">
                            <button onClick={() => setAppMode('welcome')} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            <span>Ashwini for Agriculture</span>
                        </div>
                    </div>
                 </header>
                 <div className="container mx-auto text-left px-4 pt-16 pb-24 md:pt-24 md:pb-32 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">AI-Powered Crop Analysis</h1>
                    <p className="text-lg md:text-xl drop-shadow-md text-white/90">
                        Upload an image of your crop to identify diseases and get expert advice on treatment.
                    </p>
                </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-20 bg-brand-bg">
                <svg viewBox="0 0 1440 100" fill="currentColor" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,50 Q360,100 720,50 T1440,50 V100 H0 Z" />
                </svg>
            </div>
        </div>
        <main className="container mx-auto p-4 md:p-8 -mt-12 relative z-20">
            <div className="bg-brand-bg p-4 md:p-6 rounded-lg shadow-xl">
                <CropAnalysis />
            </div>
        </main>
    </div>
  );

  const HealthApp = () => (
    <div>
        <div className="relative text-white overflow-hidden">
            <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160550-2173dba9996a?q=80&w=2070&auto=format&fit=crop')" }}
            ></div>
            <div className="absolute inset-0 bg-brand-primary opacity-80"></div>
            
            <div className="relative z-10">
                <header className="container mx-auto">
                    <div className="flex justify-between items-center p-4">
                        <div className="text-2xl font-bold flex items-center gap-4">
                             <button onClick={() => setAppMode('welcome')} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors" aria-label="Go back to welcome screen">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                             </button>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                             </svg>
                            <span>Project Ashwini</span>
                        </div>
                        <nav>
                            <div className="flex items-center gap-4 md:gap-6">
                                {Object.values(Tab).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as Tab)}
                                    className={`font-semibold transition-colors duration-200 pb-1 text-sm md:text-base
                                    ${activeTab === tab 
                                        ? 'text-white border-b-2 border-white' 
                                        : 'text-white/80 hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                                ))}
                            </div>
                        </nav>
                    </div>
                </header>

                <div className="container mx-auto text-left px-4 pt-16 pb-24 md:pt-24 md:pb-32 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">Complete Medical Analysis</h1>
                    <p className="text-lg md:text-xl drop-shadow-md text-white/90">
                        Leverage AI to understand your health reports, get insights, and stay informed.
                    </p>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-20 text-brand-bg">
                <svg viewBox="0 0 1440 100" fill="currentColor" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,50 Q360,100 720,50 T1440,50 V100 H0 Z" />
                </svg>
            </div>
        </div>
      
      <main className="container mx-auto p-4 md:p-8 -mt-12 relative z-20">
        <div className="bg-brand-bg p-4 md:p-6 rounded-lg shadow-xl">
            {renderHealthContent()}
        </div>
      </main>
    </div>
  );

    const renderApp = () => {
        switch(appMode) {
            case 'health':
                return <HealthApp />;
            case 'agriculture':
                return <AgricultureApp />;
            case 'welcome':
            default:
                return <WelcomeScreen />;
        }
    };

  return (
    <div className="min-h-screen font-sans bg-brand-bg-light">
      {renderApp()}
      {toast && <ToastNotification toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default App;
