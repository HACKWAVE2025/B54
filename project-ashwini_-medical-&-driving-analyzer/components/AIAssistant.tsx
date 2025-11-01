import React, { useState, useRef, useEffect, useCallback } from 'react';
import { startAIAssistantChat } from '../services/geminiService';
import { Chat, GenerateContentResponse, Part } from '@google/genai';

// FIX: Add a minimal interface for SpeechRecognition to fix a TypeScript error where the type was not found.
// The Web Speech API is not part of the standard DOM typings.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // Data URL for display
}

// Check for browser support for the Web Speech API
// FIX: Cast window to `any` to access non-standard browser APIs and rename variable to avoid type name collision.
const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const speechApiSupported = !!SpeechRecognitionConstructor && 'speechSynthesis' in window;

const AIAssistant: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  
  // State for voice functionality
  const [isListening, setIsListening] = useState(false);
  // FIX: This now correctly refers to the global `SpeechRecognition` interface type due to the variable rename above.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // State for image handling
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languageToCodeMap: Record<string, string> = {
      English: 'en-US',
      Hindi: 'hi-IN',
      Telugu: 'te-IN',
  };

  useEffect(() => {
    // Initialize the chat session when the component mounts.
    setChat(startAIAssistantChat());
    
    // --- Robustly load speech synthesis voices ---
    const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
    };

    if (speechApiSupported) {
        // The 'voiceschanged' event is the reliable way to get the voice list.
        window.speechSynthesis.onvoiceschanged = updateVoices;
        updateVoices(); // Also call it once initially in case the event has already fired.
    }
    
    // Clean up on unmount
    return () => {
        window.speechSynthesis?.cancel();
        recognitionRef.current?.abort();
        if (speechApiSupported) {
            window.speechSynthesis.onvoiceschanged = null;
        }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  // --- Voice Assistant Functions ---
  const speak = useCallback((text: string, langCode: string) => {
    if (!speechApiSupported) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best available voice with a priority system to ensure the most natural sound.
    const matchingVoices = voices.filter(v => v.lang === langCode);
    
    let voiceToUse: SpeechSynthesisVoice | undefined;

    // Priority 1: Google voices (often high quality and sound more natural).
    voiceToUse = matchingVoices.find(v => v.name.toLowerCase().includes('google'));

    // Priority 2: Remote/cloud-based voices (often better than default OS voices).
    if (!voiceToUse) {
        voiceToUse = matchingVoices.find(v => !v.localService);
    }
    
    // Priority 3: Any available native/local voice for the language as a fallback.
    if (!voiceToUse) {
        voiceToUse = matchingVoices[0];
    }
    
    if (voiceToUse) {
        utterance.voice = voiceToUse;
    }
    
    utterance.lang = langCode; // Setting lang is still a good fallback.
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel(); // Stop any currently speaking utterance.
    window.speechSynthesis.speak(utterance);
  }, [voices]); // Depend on the loaded voices.

  const handleToggleListen = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          if (!speechApiSupported) {
              alert("Sorry, your browser doesn't support voice recognition.");
              return;
          }
          // FIX: Use the renamed constructor variable to create a new instance.
          const recognition = new SpeechRecognitionConstructor();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = languageToCodeMap[language];
          
          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onerror = (event) => {
              console.error('Speech recognition error:', event.error);
              setIsListening(false);
          };
          
          let finalTranscript = '';
          recognition.onresult = (event) => {
              let interimTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  } else {
                      interimTranscript += event.results[i][0].transcript;
                  }
              }
              setInput(finalTranscript + interimTranscript);
              if (finalTranscript) {
                  // Automatically send when speech is final
                  handleSend(finalTranscript);
              }
          };
          
          recognition.start();
          recognitionRef.current = recognition;
      }
  };

  // --- End Voice Assistant Functions ---
  
  const clearImage = () => {
      setPreviewUrl(null);
      setImageBase64(null);
      setImageMimeType(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = reader.result as string;
        setPreviewUrl(resultString);
        setImageBase64(resultString.split(',')[1]);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSend = async (textToSend?: string) => {
    const currentInput = textToSend || input;
    if ((!currentInput.trim() && !imageBase64) || isLoading || !chat) return;

    const userMessage: Message = { 
        role: 'user', 
        text: currentInput, 
        image: previewUrl ?? undefined 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const parts: Part[] = [];
    
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
    }

    const textPrompt = `Please respond in ${language}. Here is my question: ${currentInput || '(No text provided, please describe the image)'}`;
    parts.push({ text: textPrompt });

    setInput('');
    clearImage();
    setIsLoading(true);

    try {
      // FIX: The `message` property should be the array of parts directly, not an object containing the parts.
      const response: GenerateContentResponse = await chat.sendMessage({ message: parts });
      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
      speak(response.text, languageToCodeMap[language]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessageText = "Sorry, I couldn't get a response. Please try again.";
      const errorMessage: Message = { role: 'model', text: errorMessageText };
      setMessages(prev => [...prev, errorMessage]);
      speak(errorMessageText, languageToCodeMap[language]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up flex flex-col h-[75vh] bg-brand-bg-light rounded-lg">
      <h2 className="text-2xl font-bold p-4 border-b border-gray-200 text-brand-text-dark">AI Assistant</h2>
      <div className="flex-grow p-4 overflow-y-auto bg-white">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && speechApiSupported && (
                    <button onClick={() => speak(msg.text, languageToCodeMap[language])} className="text-gray-400 hover:text-brand-primary transition-colors" aria-label="Read message aloud">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zM10 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                    </button>
                )}
              <div className={`max-w-lg px-4 py-2 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-brand-text-dark'}`}>
                 {msg.image && <img src={msg.image} alt="User upload" className="mt-1 mb-2 rounded-lg max-w-xs max-h-48" />}
                {msg.text && <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="max-w-lg px-4 py-2 rounded-2xl bg-gray-200 text-brand-text-dark">
                 <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                 </div>
               </div>
             </div>
          )}
           <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
         {previewUrl && (
            <div className="relative w-24 h-24 mb-2 p-1 border border-gray-300 rounded-md">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded"/>
                <button 
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-brand-accent text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold transition-transform hover:scale-110"
                    aria-label="Remove image"
                >
                    &times;
                </button>
            </div>
         )}
        <div className="flex items-center space-x-2 mb-2">
            <label htmlFor="language-select" className="text-sm font-medium text-gray-600">Language:</label>
            <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
            </select>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Ask a health-related question..."}
            className="flex-grow bg-white border border-gray-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
           <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold p-3 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Attach image"
           >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
           {speechApiSupported && (
              <button
                  onClick={handleToggleListen}
                  disabled={isLoading}
                  className={`text-white font-bold p-3 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none ${isListening ? 'bg-brand-accent animate-pulse' : 'bg-gray-500 hover:bg-gray-600'}`}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
              </button>
           )}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !imageBase64)}
            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
