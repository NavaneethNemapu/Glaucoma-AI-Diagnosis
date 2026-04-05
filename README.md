# AuraVis EHR: Clinical AI Diagnostic Engine 👁️

AuraVis is a professional-grade Electronic Health Record (EHR) platform integrated with a Deep Learning engine for automated Glaucoma screening. The system utilizes a **Decoupled Architecture**, separating the high-concurrency React frontend from the heavy-compute PyTorch backend.

## 🚀 Key Engineering Features
- **Identity & Access Management (IAM):** Secure provider authentication using JSON Web Tokens (JWT) and `PBKDF2` password hashing with salt.
- **Deep Learning Inference:** Optimized ResNet18 CNN fine-tuned on the EyePacs dataset, achieving high sensitivity for medical anomalies.
- **Relational Data Modeling:** A robust SQLite schema managed via SQLAlchemy ORM, implementing one-to-many relationships between Providers and Patients.
- **Out-of-Distribution (OOD) Safety:** A hard-coded 75% confidence gateway that flags inconclusive scans for manual human ophthalmic review.

## 🛠️ Technical Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, HeroIcons |
| **Backend** | Python 3.10+, Flask, Flask-SQLAlchemy |
| **Artificial Intelligence** | PyTorch, Torchvision (ResNet18), PIL |
| **Database** | SQLite (Relational) |
| **Security** | PyJWT, Werkzeug Security |

## 🏗️ System Architecture
The application follows a **Provider-Centric Workflow**. The React client maintains an encrypted state of the JWT token. All requests to the `/predict` and `/patients` endpoints are intercepted by a backend "Bouncer" (decorator) that validates the token before allowing database or AI model access.

## 📦 Installation & Setup

### 1. Backend API & AI Engine
```bash
cd backend
python -m venv myvenv
# Activate: .\myvenv\Scripts\activate (Windows) or source myvenv/bin/activate (Mac)
pip install -r requirements.txt
python app.py
```

### 2. Frontend Interface
```bash
cd frontend
npm install
npm run dev
```

## 📊 Performance & Clinical Metrics
The model utilizes **Transfer Learning** on a pre-trained ResNet18 backbone, with the final convolutional block unfrozen for domain-specific feature extraction.

- **Recall (Sensitivity):** 90.65% (Optimized to minimize False Negatives)
- **F1-Score:** 88.5%
- **Threshold Logic:** Results > 75% Confidence = Automated Verdict; < 75% = Flagged for Review.

## 🗺️ Roadmap
- [ ] **Phase 1:** Implement "Scan-to-Patient" linking for persistent medical history.
- [ ] **Phase 2:** Automated PDF Diagnostic Report generation.
- [ ] **Phase 3:** Multi-class classification (Cataract, Diabetic Retinopathy).

---
**Developed by Nemapu Navaneeth** *6th Semester Computer Science Student | Specializing in Full-Stack AI Integration*
