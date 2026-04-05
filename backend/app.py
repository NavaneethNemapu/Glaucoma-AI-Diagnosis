from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from werkzeug.utils import secure_filename
import jwt
import datetime
from functools import wraps

# Import your database blueprint and AI model
from models import db, User
from model import get_glaucoma_model

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------
# DATABASE & SECURITY CONFIGURATION
# ---------------------------------------------------------
app.config['SECRET_KEY'] = 'production-secret-key-change-later'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Boot up the Database
db.init_app(app)
with app.app_context():
    db.create_all()  # This creates the physical database.db file!

app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

print("Booting up Secure Clinical AI Engine...")

# ---------------------------------------------------------
# AI MODEL INITIALIZATION
# ---------------------------------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = get_glaucoma_model(num_classes=2)
model.load_state_dict(torch.load("best_glaucoma_model.pth", map_location=device, weights_only=True))
model = model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ---------------------------------------------------------
# SECURITY MIDDLEWARE (THE BOUNCER)
# ---------------------------------------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if the React frontend sent the VIP wristband in the headers
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] # Remove "Bearer" prefix
        
        if not token:
            return jsonify({'error': 'Security Token is missing! Please log in.'}), 401

        try:
            # Verify the token hasn't been forged or expired
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(username=data['user']).first()
        except Exception as e:
            return jsonify({'error': 'Security Token is invalid or expired!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# ---------------------------------------------------------
# AUTHENTICATION ROUTES
# ---------------------------------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Must provide username and password'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists. Please choose another.'}), 400

    new_user = User(username=data['username'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Must provide username and password'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if user and user.check_password(data['password']):
        # Create the VIP Wristband (JWT) that expires in 24 hours
        token = jwt.encode({
            'user': user.username,
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token, 'username': user.username})

    return jsonify({'error': 'Invalid username or password'}), 401

# ---------------------------------------------------------
# PATIENT MANAGEMENT ROUTES
# ---------------------------------------------------------
@app.route('/patients', methods=['POST'])
@token_required
def add_patient(current_user):
    data = request.get_json()
    
    # Verify we have the required fields
    if not data or not data.get('name') or not data.get('age'):
        return jsonify({'error': 'Missing required patient details'}), 400

    new_patient = Patient(
        name=data['name'],
        age=data['age'],
        gender=data.get('gender', 'Unknown'),
        medical_history=data.get('medical_history', ''),
        provider_id=current_user.id # Lock it to the logged-in doctor!
    )
    
    db.session.add(new_patient)
    db.session.commit()

    return jsonify({'message': 'Patient added successfully!'}), 201

@app.route('/patients', methods=['GET'])
@token_required
def get_patients(current_user):
    # Fetch ONLY the patients that belong to this specific doctor
    patients = Patient.query.filter_by(provider_id=current_user.id).all()
    
    output = []
    for patient in patients:
        output.append({
            'id': patient.id,
            'name': patient.name,
            'age': patient.age,
            'gender': patient.gender,
            'medical_history': patient.medical_history,
            'date_added': patient.date_added.strftime('%Y-%m-%d')
        })
        
    # Reverse the list so the newest patients appear at the top
    return jsonify(output[::-1]), 200

# ---------------------------------------------------------
# CLINICAL AI ROUTES
# ---------------------------------------------------------
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "online", "message": "Secure API is running."})

@app.route('/predict', methods=['POST'])
@token_required # <-- THE ROUTE IS NOW LOCKED!
def predict(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Read the image
        img_pil = Image.open(filepath).convert('RGB')
        input_tensor = transform(img_pil).unsqueeze(0).to(device)

        # Make the Diagnosis
        with torch.no_grad():
            output = model(input_tensor)
            probs = F.softmax(output, dim=1)[0]
            nrg_prob = probs[0].item() * 100
            rg_prob = probs[1].item() * 100

        # The Clinical Safety Logic
        if rg_prob > 75.0:
            verdict = "Glaucoma Detected"
            confidence = f"{rg_prob:.2f}%"
            color = "red"
        elif nrg_prob > 75.0:
            verdict = "Normal Eye"
            confidence = f"{nrg_prob:.2f}%"
            color = "green"
        else:
            verdict = "Inconclusive (Requires Human Review)"
            confidence = f"{max(rg_prob, nrg_prob):.2f}%"
            color = "orange"

        os.remove(filepath)

        return jsonify({
            'verdict': verdict,
            'confidence': confidence,
            'color': color,
            'details': f"Glaucoma: {rg_prob:.1f}% | Normal: {nrg_prob:.1f}%",
            'analyzed_by': current_user.username # <-- Proof the token worked!
        })

if __name__ == '__main__':
    app.run(debug=True)