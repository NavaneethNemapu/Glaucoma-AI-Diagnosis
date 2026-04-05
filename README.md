# AuraVis EHR: Clinical AI Diagnostic Engine 👁️

AuraVis is a production-grade Electronic Health Record (EHR) platform integrated with a Deep Learning engine for automated Glaucoma screening. Built with a decoupled architecture, it features a React-based provider dashboard and a Flask REST API powered by a fine-tuned ResNet18 CNN.

## 🚀 Key Features
- **Secure Provider Authentication:** Implemented JSON Web Tokens (JWT) for secure session management and military-grade password hashing via Werkzeug.
- **AI-Powered Diagnostics:** Leverages a ResNet18 Convolutional Neural Network (CNN) to analyze retinal fundus images with a **90.65% Recall** and **88.5% F1-Score**.
- **Patient Management System:** A full-stack CRUD directory using SQLAlchemy and SQLite to manage patient records and clinical histories.
- **Safety-First Logic:** Features a 75% confidence threshold to flag "Inconclusive" scans for manual human review (OOD detection).

## 🛠️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Vite |
| **Backend** | Python, Flask, Flask-CORS |
| **Database** | SQLite, SQLAlchemy (ORM) |
| **AI/ML** | PyTorch, Torchvision, NumPy |
| **Security** | PyJWT (JSON Web Tokens) |

## 🏗️ System Architecture
The system follows a **Decoupled Architecture**. The React frontend acts as the thin-client UI, communicating with the Flask API via asynchronous fetch requests. All AI inference is performed server-side to protect model weights and ensure computational efficiency.



## 📦 Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv myvenv
# Activate the environment
# Windows: .\myvenv\Scripts\activate | Mac/Linux: source myvenv/bin/activate
pip install -r requirements.txt
python app.py
