# 🌟 Project Ashwini  
### *An AI-Powered Life, Health & Agriculture Companion*  
**Track:** Open Innovation  
**Team:** Teamvignan

---

## 🧠 Overview  
**Project Ashwini** is a full-stack AI and ML-driven platform that combines **healthcare**, **agriculture**, and **safety** into one unified ecosystem.  
It offers intelligent diagnostics, crop disease detection, crash alerts, lifestyle tracking, and an advanced medical chatbot — all powered by real-time AI.

---

## 🚀 Key Features  

### 🏥 Healthcare Intelligence  
- AI analyzes **medical scans and lab reports** for instant insights.  
- Users can log **sugar, BP, food, and activity** to track chronic conditions.  
- A built-in **“Learn” module** educates users about medicines and ingredients.

### 🤖 AI Doctor Chatbot  
- Advanced chatbot that **diagnoses diseases based on symptoms**.  
- Accepts **photo uploads** to detect skin diseases or wound conditions.  
- Provides first-aid advice and medical guidance instantly.

### 🌾 Agriculture Support  
- Farmers upload **leaf, stem, or soil images** for disease detection.  
- Suggests the right **pesticides and fertilizers** for each crop.  
- AI model trained on diverse plant disease datasets for high accuracy.

### 🚗 Smart Safety Mode  
- Listens for **crash sounds, loud impacts, or shake patterns** during driving.  
- If no response in 15 seconds, automatically sends **emergency SMS with live GPS** to registered contacts.  

### 📊 Lifestyle Tracker  
- Keeps logs of diet, activities, and vitals.  
- Predicts health risks like **diabetes or hypertension** based on trends.  

---

## 🧩 Tech Stack  

| Layer | Technologies Used |
|-------|--------------------|
| **Frontend** | React.js + TypeScript + TailwindCSS |
| **Backend** | Node.js + Express.js |
| **Database** | Firebase Firestore / MongoDB Atlas |
| **AI/ML** | TensorFlow, PyTorch, OpenCV, Hugging Face |
| **Storage** | Firebase Cloud Storage |
| **APIs** | Gemini / Azure Cognitive / Twilio (alerts) |
| **Hosting** | Firebase Hosting + Azure ML Endpoint |

---

## 🧠 AI Models Used  
- **Medical Analysis Model:** Detects patterns in ECG, MRI, and lab data.  
- **Symptom-Based Chatbot Model:** LLM-based diagnostic engine using NLP and medical datasets.  
- **Crop Disease Model:** CNN model trained on plant disease datasets (ResNet / MobileNet).  
- **Crash Detection Model:** Audio classification (MFCC + LSTM).  

---

## ⚙️ System Architecture  
1. User uploads medical or crop image via React interface.  
2. Image stored in Firebase Storage.  
3. Node backend sends the image/symptoms to the appropriate AI model.  
4. Model returns predictions → saved to Firestore.  
5. Frontend displays diagnosis, recommendations, or alerts.  
6. Chatbot layer handles conversational support across all domains.  

---

## 💡 Why Open Innovation?  
Ashwini blends **Healthcare, Agriculture, and Safety** — fields rarely combined — into one accessible AI ecosystem.  
It represents **true Open Innovation** by solving real-world problems using intelligent, modular, and scalable technology.

---

## 🔒 Security  
- End-to-end encryption for health and personal data.  
- API keys secured via environment variables.  
- Role-based access (Doctor, Patient, Farmer).  

---

## 🏁 Future Enhancements  
- Integrate wearable IoT sensors for continuous monitoring.  
- Multilingual voice assistant for rural accessibility.  
- Connect with local hospitals and agri experts for verified guidance.  

---

## 📜 License  
This project is developed for **HackWave 2025 – Open Innovation Track**.  
All components are original, built by Teamvignan.

---
