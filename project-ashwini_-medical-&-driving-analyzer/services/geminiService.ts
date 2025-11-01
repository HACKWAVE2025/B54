import { GoogleGenAI, GenerateContentResponse, Type, Part, Chat } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

// This is the schema the UI expects for a medical report analysis.
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    criticalAlert: {
      type: Type.STRING,
      description: "The assessed criticality of the report findings. Can be 'NONE', 'LOW', 'MEDIUM', or 'HIGH'.",
    },
    summary: {
      type: Type.STRING,
      description: "A concise, one-paragraph summary of the report's key findings, written in plain, easy-to-understand language.",
    },
    kidneyStoneDetails: {
        type: Type.ARRAY,
        description: "Specific details about any kidney stones found in the report.",
        items: {
            type: Type.OBJECT,
            properties: {
                size: { type: Type.STRING, description: "The size of the stone, including units (e.g., '5mm')." },
                location: { type: Type.STRING, description: "The precise location of the stone (e.g., 'Left kidney, upper pole')." }
            },
            required: ["size", "location"]
        }
    },
    resultsBreakdown: {
      type: Type.ARRAY,
      description: "An array of objects, where each object details a specific test result from the report.",
      items: {
        type: Type.OBJECT,
        properties: {
          testName: { type: Type.STRING, description: "The name of the test or measurement (e.g., 'Glucose', 'Blood Pressure')." },
          result: { type: Type.STRING, description: "The measured value or result (e.g., '150 mg/dL', '120/80 mmHg')." },
          explanation: { type: Type.STRING, description: "A simple explanation of what this result means." },
        },
        required: ["testName", "result", "explanation"],
      }
    },
    termDefinitions: {
      type: Type.ARRAY,
      description: "An array of objects defining any complex medical terms found in the report.",
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "The medical term." },
          definition: { type: Type.STRING, description: "A simple, clear definition of the term." },
        },
        required: ["term", "definition"],
      }
    },
  },
  required: ["criticalAlert", "summary", "resultsBreakdown", "termDefinitions"],
};


export const analyzeMedicalReport = async (
  reportText: string,
  reportType: string,
  language: string,
  image?: { data: string; mimeType: string }
): Promise<GenerateContentResponse> => {

  let prompt = `
    Analyze the following medical report. The report type is "${reportType}".
    The user-provided text is below:
    ---
    ${reportText}
    ---
    The user may have also provided an image of the report.

    Your task is to act as a helpful medical AI assistant. Your goal is to simplify this report for a non-medical user.
    - Carefully extract key information.
    - Provide a clear summary.
    - Most importantly, assess the urgency or criticality.
    - DO NOT provide a diagnosis or medical advice. Emphasize that the user must consult a healthcare professional.

    IMPORTANT INSTRUCTION: Your entire response, including the summary, explanations, and definitions inside the JSON object, must be in ${language}.
    However, for the 'criticalAlert' field, you must ONLY use one of the following English strings: 'NONE', 'LOW', 'MEDIUM', or 'HIGH'.

    Return the analysis in the structured JSON format specified.
  `;

  // Use a specialized prompt for ECG analysis to detect critical conditions like heart attacks.
  if (reportType === 'ECG') {
    prompt = `
    You are an expert AI assistant specializing in cardiology. Your task is to analyze the following ECG report and provide a structured JSON response.

    ECG Report Data:
    ---
    Text: ${reportText}
    (An image may also be provided)
    ---

    Analysis Instructions:
    1.  **Primary Goal**: Identify signs of a potential myocardial infarction (heart attack) or other critical cardiac events.
    2.  **Key Indicators**: Specifically look for the following indicators:
        - ST-segment elevation (STEMI) or ST-segment depression.
        - T-wave inversion.
        - Pathological Q waves.
    3.  **Criticality Assessment ('criticalAlert' field)**: You MUST set the 'criticalAlert' field based on these rules:
        - **'HIGH'**: Use this if you find strong evidence of a potential myocardial infarction or other life-threatening condition based on the key indicators.
        - **'MEDIUM'**: Use this for other significant but less immediately life-threatening abnormalities (e.g., atrial fibrillation, bradycardia, arrhythmias).
        - **'NONE'**: Use this if the ECG report appears normal or shows only minor, non-critical variations.
        - **'LOW'**: Use for minor abnormalities that are not urgent.
    4.  **Summary Content**:
        - Do NOT provide a definitive diagnosis.
        - If the 'criticalAlert' is 'HIGH', your summary MUST begin with a sentence STRONGLY urging the user to seek immediate medical attention (e.g., "These findings are highly concerning and may indicate a serious cardiac event. Please contact emergency services or go to the nearest hospital immediately.").
    5.  **Language Requirement**:
        - The entire JSON response (summary, explanations, definitions) MUST be written in ${language}.
        - The 'criticalAlert' field value MUST be one of the following exact English strings: 'NONE', 'LOW', 'MEDIUM', 'HIGH'.

    Return ONLY the structured JSON object that matches the required schema.
    `;
  } else if (reportType === 'Kidney Report') {
        prompt = `
        You are an expert AI assistant specializing in radiology and nephrology. Your task is to analyze the following kidney report (likely an ultrasound or CT scan) and provide a structured JSON response.

        Report Data:
        ---
        Text: ${reportText}
        (An image may also be provided)
        ---

        Analysis Instructions:
        1.  **Primary Goal**: Detect the presence, size, and location of any renal calculi (kidney stones).
        2.  **Data Extraction**:
            - If kidney stones are mentioned, you MUST extract their **exact size** (e.g., "5mm", "1.2cm") and **precise location** (e.g., "left kidney, lower pole", "right ureterovesical junction").
            - Populate the 'kidneyStoneDetails' array with an object for each stone found. If no stones are found, this array should be empty or omitted.
        3.  **Criticality Assessment ('criticalAlert' field)**:
            - **'HIGH'**: Use this for large stones (e.g., >10mm) or stones causing significant obstruction (hydronephrosis).
            - **'MEDIUM'**: Use for smaller stones that are likely to cause symptoms but are not immediately life-threatening.
            - **'LOW'**: Use for very small, non-obstructive stones (gravel).
            - **'NONE'**: Use if the report is completely normal and no stones are found.
        4.  **Language Requirement**:
            - The entire JSON response (summary, explanations, definitions, stone locations) MUST be in ${language}.
            - The 'criticalAlert' field value MUST be one of the following exact English strings: 'NONE', 'LOW', 'MEDIUM', 'HIGH'.
            - The 'size' field within 'kidneyStoneDetails' should preserve the original units (e.g., '5mm').

        Return ONLY the structured JSON object that matches the required schema.
        `;
    }

  const parts: Part[] = [{ text: prompt }];

  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  return response;
};

const organDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        relatedTests: {
            type: Type.ARRAY,
            description: "A list of common medical tests for this organ. For example, for 'Lungs', include 'Chest X-ray', 'CT scan of the chest', etc.",
            items: { type: Type.STRING }
        },
        relatedDiseases: {
            type: Type.ARRAY,
            description: "A list of common diseases related to this organ.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the disease (e.g., 'Asthma', 'Pneumonia')." },
                    symptoms: {
                        type: Type.ARRAY,
                        description: "A list of 3-5 common symptoms for this disease.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["name", "symptoms"]
            }
        }
    },
    required: ["relatedTests", "relatedDiseases"]
};

export const getOrganInformation = async (organ: string): Promise<GenerateContentResponse> => {
  const prompt = `
    For the human organ "${organ}", provide a list of related medical tests and a list of common diseases with their typical symptoms.
    Return the information in the structured JSON format specified.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: organDetailsSchema,
    }
  });

  return response;
};


export const startAIAssistantChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a specialized medical AI assistant. Your ONLY purpose is to answer health and medical-related questions. If a user asks a question that is NOT related to medicine, health, biology, or wellness, you MUST politely decline to answer and state that you are only programmed for medical inquiries. For all medical questions, provide general information and ALWAYS remind the user to consult a healthcare professional for actual medical advice.'
        }
    });
};

export const getWellnessTip = async (category: 'Recipe' | 'Workout' | 'Mindfulness'): Promise<GenerateContentResponse> => {
    let prompt = '';
    switch (category) {
        case 'Recipe':
            prompt = "Generate a simple, healthy recipe. The recipe should be for one serving, take less than 30 minutes to prepare, and include a list of ingredients and step-by-step instructions. Format the response clearly with headings for ingredients and instructions.";
            break;
        case 'Workout':
            prompt = "Suggest a quick 10-minute workout routine that can be done at home with no equipment. For each exercise, provide a brief, clear description of how to perform it. Include a suggested number of reps or duration for each.";
            break;
        case 'Mindfulness':
            prompt = "Provide a practical mindfulness or stress-reduction tip that can be done in under 5 minutes. Explain the steps clearly so a beginner can follow along easily.";
            break;
    }

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response;
};

const facilitySchema = {
    type: Type.ARRAY,
    description: "A list of the top 3 suggested facilities based on public ratings and proximity.",
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the facility." },
            rating: { type: Type.STRING, description: "The rating of the facility, e.g., '4.5 stars'." },
            address: { type: Type.STRING, description: "The full address of the facility." }
        },
        required: ["name", "rating", "address"]
    }
};

export const getNearbyFacilities = async (location: string, facilityType: string): Promise<GenerateContentResponse> => {
    const prompt = `
        You are a helpful local guide AI. Your task is to find the top 3 best "${facilityType}" near "${location}".
        Your primary goal is to find the facilities that are closest, while also having good public ratings. The first suggestion should ideally be the nearest option with a high rating.
        Balance both proximity and quality in your suggestions.
        Base your suggestions on publicly available information, such as Google Maps data.
        Return your findings as a structured JSON array. Each item in the array should be an object containing the facility's 'name', 'rating', and 'address'.
        If you cannot find any reliable results, return an empty array.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: facilitySchema,
        }
    });

    return response;
};

// --- NEW AGRICULTURE ANALYSIS FUNCTION ---
const cropAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise, one-paragraph summary of the crop's condition, written in simple, farmer-friendly language.",
    },
    potentialDiseases: {
      type: Type.ARRAY,
      description: "An array of objects, where each object details a potential disease found.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The common name of the disease (e.g., 'Powdery Mildew', 'Rust')." },
          explanation: { type: Type.STRING, description: "A simple explanation of what this disease is and how it affects the plant." },
        },
        required: ["name", "explanation"],
      }
    },
    fertilizerSuggestions: {
      type: Type.ARRAY,
      description: "A list of suggested fertilizers to improve plant health.",
      items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the fertilizer or nutrient (e.g., 'NPK 10-10-10', 'Potassium Nitrate')." },
            reason: { type: Type.STRING, description: "A brief reason why this fertilizer is recommended." }
        },
        required: ["name", "reason"]
      }
    },
    pesticideSuggestions: {
       type: Type.ARRAY,
       description: "A list of suggested pesticides to combat the identified diseases.",
       items: {
         type: Type.OBJECT,
         properties: {
             name: { type: Type.STRING, description: "The name or type of the pesticide (e.g., 'Neem Oil', 'Sulfur-based fungicide')." },
             reason: { type: Type.STRING, description: "A brief reason why this pesticide is recommended for the identified issues." }
         },
         required: ["name", "reason"]
       }
    },
  },
  required: ["summary", "potentialDiseases", "fertilizerSuggestions", "pesticideSuggestions"],
};

export const analyzeCrop = async (
  reportText: string,
  cropPartType: string,
  language: string,
  image: { data: string; mimeType: string }
): Promise<GenerateContentResponse> => {
  const prompt = `
    You are an expert AI assistant specializing in agriculture and plant pathology. Your task is to analyze the provided image and text of a crop part.

    The user is showing you an image of a crop's "${cropPartType}".
    The user-provided text is below:
    ---
    ${reportText}
    ---

    Analysis Instructions:
    1.  **Primary Goal**: Visually analyze the image to identify signs of diseases, nutrient deficiencies, or pest damage. Use the text for additional context.
    2.  **Farmer-Friendly Summary**: Provide a simple, easy-to-understand summary of the plant's overall health based on your analysis.
    3.  **Identify Diseases**: List any potential diseases you can identify. For each one, provide its common name and a simple explanation.
    4.  **Suggest Treatments**:
        - Recommend specific types of **fertilizers** or nutrients that could help, explaining why.
        - Recommend specific types of **pesticides** (e.g., fungicides, insecticides, or organic alternatives like neem oil) that would be effective against the identified issues, explaining why.
    5.  **Important Disclaimer**: ALWAYS include a disclaimer that this is an AI-generated analysis and a local agricultural expert should be consulted for a definitive diagnosis.
    6.  **Language Requirement**: The entire JSON response (summary, explanations, suggestions, reasons) MUST be written in ${language}.

    Return ONLY the structured JSON object that matches the required schema.
  `;

  const parts: Part[] = [
    { text: prompt },
    {
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: cropAnalysisSchema,
    },
  });

  return response;
};
