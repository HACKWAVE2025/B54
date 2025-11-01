import React, { useState } from 'react';

interface EmergencyProps {
  contact: string;
  onSOS: () => Promise<{ success: boolean }>;
}

const Emergency: React.FC<EmergencyProps> = ({ contact, onSOS }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSOS = async () => {
    setIsSending(true);
    setIsSent(false);

    // This now calls the function passed from App.tsx to send a real SMS
    const result = await onSOS();

    setIsSending(false);
    if (result.success) {
      setIsSent(true);
      // Reset the success message after a while
      setTimeout(() => setIsSent(false), 5000);
    }
    // Error feedback is handled by a global toast in App.tsx
  };

  return (
    <div className="animate-fade-in-up text-center h-full flex flex-col justify-center items-center p-4">
      <h2 className="text-4xl font-bold mb-4 text-brand-text-dark">Emergency Mode</h2>
      <p className="text-gray-600 mb-8 max-w-xl mx-auto">
        Click the SOS button for immediate help. An SMS alert will be sent to your emergency contact.
      </p>

      <div className="bg-brand-bg-light rounded-lg p-8 w-full max-w-md">
        <div className="mb-8">
          <p className="block text-sm font-medium text-gray-600 mb-1">
            Emergency Contact Number:
          </p>
          <p className="text-2xl font-mono text-brand-primary tracking-wider">
            {contact}
          </p>
        </div>


        <div className="flex flex-col items-center">
          <button
            onClick={handleSOS}
            disabled={isSending || isSent}
            className="relative w-48 h-48 bg-brand-accent rounded-full flex flex-col items-center justify-center text-white font-bold text-4xl shadow-lg
                      transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-red-500
                      focus:outline-none focus:ring-4 focus:ring-red-500/50
                      disabled:bg-red-300 disabled:cursor-not-allowed disabled:scale-100"
            style={{animation: 'pulseGlow 2s infinite ease-in-out'}}          
          >
            {isSending && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              </div>
            )}
            {!isSending && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>SOS</span>
              </>
            )}
          </button>

          <div className="h-6 mt-6">
            {isSent && (
              <p className="text-green-600 animate-fade-in-up">Emergency alert sent successfully!</p>
            )}
            {isSending && (
                <p className="text-yellow-600 animate-fade-in-up">Sending emergency alert...</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Emergency;