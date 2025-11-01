// Fix: Implement the full DrivingMode component to resolve module errors.
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DrivingModeProps {
  onAlert: () => void;
}

const DrivingMode: React.FC<DrivingModeProps> = ({ onAlert }) => {
  const [isListening, setIsListening] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [alertSent, setAlertSent] = useState(false);

  // Refs to hold audio-related objects that shouldn't trigger re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // Fix: The return type of setInterval in the browser is a number, not NodeJS.Timeout.
  const countdownIntervalRef = useRef<number | null>(null);
  const demoTimeoutRef = useRef<number | null>(null);

  const LOUD_SOUND_THRESHOLD = 180; // Value from 0-255. Lowered from 200 for improved sensitivity to spikes.

  const stopListening = useCallback(() => {
    console.log('Stopping microphone...');
    if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
        demoTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsListening(false);
  }, []);


  const startCountdown = useCallback(() => {
    // Only start if not already counting down
    if (isCountingDown) return;

    console.log('Loud sound detected! Starting countdown...');
    stopListening(); // Stop listening for more sounds
    setIsCountingDown(true);
    setCountdown(20);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setIsCountingDown(false);
          setAlertSent(true);
          onAlert(); // Trigger the SMS alert
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isCountingDown, onAlert, stopListening]);


  const startListening = useCallback(async () => {
    console.log('Activating microphone...');
    setAlertSent(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const context = new AudioContext();
      audioContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkForLoudSound = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const maxVolume = Math.max(...dataArray);

          if (maxVolume > LOUD_SOUND_THRESHOLD) {
            startCountdown();
            return; // Stop the animation loop
          }
        }
        animationFrameRef.current = requestAnimationFrame(checkForLoudSound);
      };

      setIsListening(true);
      checkForLoudSound();

      // Automatically trigger the alert after 5 seconds for demo purposes.
      demoTimeoutRef.current = window.setTimeout(startCountdown, 5000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access the microphone. Please grant permission and try again.');
    }
  }, [startCountdown]);
  
  const handleCancelCountdown = () => {
    console.log('Countdown canceled by user.');
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsCountingDown(false);
    // Optionally, restart listening or go back to idle
    startListening();
  };

  useEffect(() => {
    // Cleanup function to stop listening when the component unmounts
    return () => {
      stopListening();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [stopListening]);

  const csharpSnippet = `
// C# ASP.NET Core API Controller (Backend Logic)
[ApiController]
[Route("api/[controller]")]
public class DrivingAlertController : ControllerBase
{
    private readonly ISmsService _smsService;

    public DrivingAlertController(ISmsService smsService)
    {
        _smsService = smsService;
    }

    [HttpPost("incident")]
    public async Task<IActionResult> ReportIncident([FromBody] IncidentPayload payload)
    {
        // Log the incident details from the payload
        Console.WriteLine($"Incident detected for user {payload.UserId} at {payload.Location}");
        
        // Fetch the user's emergency contact from a database
        var emergencyContact = await GetEmergencyContact(payload.UserId);

        // Send an alert using a service like Twilio
        await _smsService.SendAlertAsync(
            emergencyContact,
            $"CRASH DETECTED for user at {payload.Location}. Please check on them."
        );

        return Ok(new { Status = "AlertSent" });
    }
}
`.trim();

  const renderContent = () => {
    if (alertSent) {
      return (
        <>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          <h3 className="text-xl font-bold text-green-600 mb-3">Emergency Alert Sent</h3>
          <p className="text-gray-600 mb-6">Your emergency contact has been notified.</p>
           <button
            onClick={() => setAlertSent(false)}
            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:-translate-y-1"
          >
            Reset
          </button>
        </>
      )
    }

    if (isCountingDown) {
      return (
        <>
          <h3 className="text-xl font-bold text-yellow-600 mb-3">Loud Sound Detected!</h3>
          <p className="text-gray-600 mb-4">Sending an emergency alert unless canceled.</p>
          <div className="text-8xl font-bold text-brand-text-dark my-6">{countdown}</div>
          <button
            onClick={handleCancelCountdown}
            className="w-full bg-brand-accent hover:bg-red-700 text-white font-bold py-4 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1"
          >
            CANCEL ALERT
          </button>
        </>
      )
    }

    if (isListening) {
      return (
        <>
          <h3 className="text-xl font-bold text-brand-primary mb-3">Listening...</h3>
          <div className="flex justify-center items-center my-8">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 bg-brand-primary/30 rounded-full animate-ping"></div>
              <div className="relative flex items-center justify-center h-24 w-24 bg-brand-primary/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">Microphone is active. A loud sound will trigger an alert countdown.</p>
          <button
            onClick={stopListening}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:-translate-y-1"
          >
            Deactivate
          </button>
        </>
      )
    }

    return (
      <>
        <h3 className="text-xl font-bold text-brand-text-dark mb-3">Activate Driving Mode</h3>
        <p className="text-gray-600 mb-6">This will activate the microphone to listen for potential crash events.</p>
        <button
          onClick={startListening}
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1"
        >
          Activate
        </button>
      </>
    );
  }

  return (
    <div className="animate-fade-in-up text-center p-4 h-full flex flex-col justify-center items-center">
      <h2 className="text-4xl font-bold mb-4 text-brand-text-dark">Driving Mode</h2>
      <p className="text-gray-600 mb-8 max-w-xl mx-auto">
        Your AI-powered safety co-pilot.
      </p>

      <div className="w-full max-w-md p-6 bg-brand-bg-light rounded-lg">
        {renderContent()}
      </div>

       <div className="w-full max-w-2xl mt-8">
            <h3 className="font-semibold text-gray-700 mb-2">Backend Logic (C# Example)</h3>
            <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm font-mono text-left">
                <pre><code>{csharpSnippet}</code></pre>
            </div>
        </div>
    </div>
  );
};

export default DrivingMode;