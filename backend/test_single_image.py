import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import os

# Import your custom ResNet18 brain
from model import get_glaucoma_model

# === CONFIGURATION ===
# Paste the absolute path to any raw JPG image you want to test
IMAGE_PATH = r"C:\Users\navan\Pictures\Screenshots\Screenshot 2026-03-31 234223.png"
MODEL_WEIGHTS = "best_glaucoma_model.pth"

def predict_single_image(image_path):
    if not os.path.exists(image_path):
        print(f"\n[ERROR] Could not find the image. Check the path:\n{image_path}")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nEngine Status: ONLINE")
    print(f"Device: {device.type.upper()}")

    # 1. Load the ResNet18 Champion
    model = get_glaucoma_model(num_classes=2)
    model.load_state_dict(torch.load(MODEL_WEIGHTS, map_location=device, weights_only=True))
    model = model.to(device)
    model.eval() # STRICTLY testing mode

    # 2. Prepare the Standard Translator (NO OpenCV needed anymore!)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 3. Read the Raw Image
    img_pil = Image.open(image_path).convert('RGB')
    
    # Add a fake "batch" dimension of 1 for the AI (it expects a list of images)
    input_tensor = transform(img_pil).unsqueeze(0).to(device)

    # 4. Make the Clinical Diagnosis
    with torch.no_grad():
        output = model(input_tensor)
        probs = F.softmax(output, dim=1)[0]
        
        # Multiply by 100 to get clean percentages
        nrg_prob = probs[0].item() * 100
        rg_prob = probs[1].item() * 100

    # 5. Print the elegant scorecard
    print("\n" + "="*45)
    print("             AI CLINICAL DIAGNOSIS")
    print("="*45)
    print(f"File: {os.path.basename(image_path)}")
    print("-" * 45)
    print(f"Normal Eye (NRG) Confidence: {nrg_prob:6.2f}%")
    print(f"Glaucoma (RG) Confidence:    {rg_prob:6.2f}%")
    print("-" * 45)
    
    if rg_prob > 50:
        print(">>> FINAL VERDICT: GLAUCOMA DETECTED")
    else:
        print(">>> FINAL VERDICT: NORMAL EYE")
    print("="*45 + "\n")

if __name__ == "__main__":
    predict_single_image(IMAGE_PATH)