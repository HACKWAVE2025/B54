import React, { useState, useRef } from 'react';
import { analyzeMedicalReport } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface MedicalAnalysisProps {
  onNewAnalysis: (result: AnalysisResult) => void;
}

const MedicalAnalysis: React.FC<MedicalAnalysisProps> = ({ onNewAnalysis }) => {
  const [report, setReport] = useState('');
  const [reportType, setReportType] = useState('Lab Report');
  const [language, setLanguage] = useState('English');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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
    if (!report.trim() && !imageFile) {
      setError('Please paste your medical report or upload an image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const imagePayload = imageBase64 && imageMimeType ? { data: imageBase64, mimeType: imageMimeType } : undefined;
      const response = await analyzeMedicalReport(report, reportType, language, imagePayload);
      let jsonText = response.text;

      // Robust JSON parsing: The model might wrap the JSON in markdown.
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].trim();
      }

      const result = JSON.parse(jsonText);
      const resultWithMeta = { ...result, reportType: reportType, language: language };

      setAnalysis(resultWithMeta);
      onNewAnalysis(resultWithMeta);
    } catch (e) {
      console.error(e);
      setError('Failed to analyze the report. The AI response may be malformed or a network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const CriticalAlertBanner: React.FC<{ level: string }> = ({ level }) => {
    if (!level || level.toUpperCase() === 'NONE' || level.toUpperCase() === 'LOW') return null;

    const config = {
      HIGH: {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-brand-accent',
        title: 'Critical Alert',
        message: 'This report contains findings that may require immediate attention. Please consult your healthcare provider as soon as possible.'
      },
      MEDIUM: {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-500',
        title: 'Important Finding',
        message: 'This report contains notable findings. It is advisable to discuss these results with your healthcare provider.'
      }
    };
    
    const alertConfig = config[level.toUpperCase() as keyof typeof config];
    if (!alertConfig) return null;

    return (
        <div className={`p-4 border-l-4 rounded-md my-4 ${alertConfig.bgColor} ${alertConfig.borderColor}`}>
            <h3 className={`font-bold ${alertConfig.textColor}`}>{alertConfig.title}</h3>
            <p className={`text-sm ${alertConfig.textColor}`}>{alertConfig.message}</p>
        </div>
    );
  }
  
  const csharpSnippet = `
// C# Azure Function Example (Backend Logic)
[FunctionName("AnalyzeMedicalReport")]
public static async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
    ILogger log)
{
    log.LogInformation("C# HTTP trigger function processed a request.");

    string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
    var data = JsonConvert.DeserializeObject<ReportRequest>(requestBody);

    // 1. Call the Gemini API with the report data
    var analysisResult = await _geminiService.AnalyzeAsync(data.ReportText, data.ImageBase64);

    // 2. If critical, trigger an alert via Twilio
    if (analysisResult.IsCritical)
    {
        await _twilioService.SendSmsAsync(
            "+1234567890", // Emergency Contact
            $"CRITICAL ALERT: {analysisResult.Summary}"
        );
    }

    // 3. Return the structured JSON analysis to the client
    return new OkObjectResult(analysisResult);
}
  `.trim();

  return (
    <div className="animate-fade-in-up grid md:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col p-2">
        <h2 className="text-2xl font-bold mb-4 text-brand-text-dark">Analyze Report</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-600 mb-2">Report Type</label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-brand-text-dark rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                >
                  <option>Lab Report</option>
                  <option>Imaging (X-ray, CT, MRI)</option>
                  <option>ECG</option>
                  <option>Kidney Report</option>
                  <option>Other</option>
                </select>
            </div>
            <div>
                 <label htmlFor="language" className="block text-sm font-medium text-gray-600 mb-2">Language</label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-brand-text-dark rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Telugu</option>
                </select>
            </div>
        </div>

        <label htmlFor="reportText" className="block text-sm font-medium text-gray-600 mb-2">Paste Report Text</label>
        <textarea
          id="reportText"
          rows={10}
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Paste your medical report text here..."
          className="w-full bg-gray-50 border border-gray-300 text-brand-text-dark rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
        />

        <div className="my-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Or Upload an Image</label>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors
                    ${isDragging ? 'border-brand-primary bg-brand-primary/10' : ''}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-600">
                        {imageFile ? <span className="font-semibold">{imageFile.name}</span> : "Drag & drop an image here"}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-4 py-2 rounded-md transition-colors"
                        >
                            Or Browse Files
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Report'}
        </button>

      </div>
      <div className="bg-brand-bg-light p-4 md:p-6 rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-brand-text-dark">Analysis Result</h2>
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {analysis && (
          <div className="space-y-6">
            <CriticalAlertBanner level={analysis.criticalAlert} />
            <div>
              <h3 className="font-bold text-lg text-brand-primary mb-2">Summary</h3>
              <p className="text-brand-text-dark bg-gray-100 p-3 rounded-md">{analysis.summary}</p>
            </div>
            
            {analysis.kidneyStoneDetails?.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-brand-primary mb-2">Kidney Stone Details</h3>
                <ul className="space-y-2">
                  {analysis.kidneyStoneDetails.map((stone: any, index: number) => (
                    <li key={index} className="bg-gray-100 p-3 rounded-md">
                      <strong>Stone {index + 1}:</strong> {stone.size} located in the {stone.location}.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-bold text-lg text-brand-primary mb-2">Results Breakdown</h3>
              <ul className="space-y-2">
                {analysis.resultsBreakdown.map((item: any, index: number) => (
                  <li key={index} className="bg-gray-100 p-3 rounded-md">
                    <strong className="block">{item.testName}: {item.result}</strong>
                    <span className="text-sm text-gray-600">{item.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-brand-primary mb-2">Term Definitions</h3>
              <dl>
                {analysis.termDefinitions.map((item: any, index: number) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-md mb-2">
                    <dt className="font-semibold">{item.term}</dt>
                    <dd className="text-sm text-gray-600">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
             <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Backend Logic (C# Example)</h3>
                <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    <pre><code>{csharpSnippet}</code></pre>
                </div>
            </div>
          </div>
        )}
        {!isLoading && !analysis && !error && (
          <div className="text-center text-gray-500 h-full flex items-center justify-center">
            <p>Your analysis results will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalAnalysis;