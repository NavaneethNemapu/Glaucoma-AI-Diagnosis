import torch
import torch.nn as nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

# Import your custom brain
from model import get_glaucoma_model

# === CONFIGURATION ===
# Point this exactly to your TEST folder
TEST_DIR = r"C:\Users\navan\Desktop\Sem-Project\backend\eyepac-light-v2-512-jpg"
MODEL_WEIGHTS = "best_glaucoma_model.pth"
BATCH_SIZE = 32

def evaluate_test_set():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Engine Status: ONLINE")
    print(f"Device: {device.type.upper()} (RTX 2050)\n")

    # 1. Load the Brain
    model = get_glaucoma_model(num_classes=2)
    model.load_state_dict(torch.load(MODEL_WEIGHTS, map_location=device, weights_only=True))
    model = model.to(device)
    model.eval() # STRICTLY testing mode (no learning!)

    # 2. Setup the Test Conveyor Belt 
    # Must match the validation transforms exactly!
    test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print(f"Scanning test folder: {TEST_DIR}")
    test_dataset = datasets.ImageFolder(TEST_DIR, transform=test_transform)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    classes = test_dataset.classes
    print(f"Found classes: {classes}")
    print(f"Total test images found: {len(test_dataset)}\n")

    # 3. Scoreboards
    running_corrects = 0
    total_images = 0
    
    # Clinical metrics
    true_positives = 0  # AI said Glaucoma, and it WAS Glaucoma
    true_negatives = 0  # AI said Normal, and it WAS Normal
    false_positives = 0 # AI said Glaucoma, but it was NORMAL (False Alarm)
    false_negatives = 0 # AI said Normal, but it was GLAUCOMA (Missed Diagnosis)

    print("Starting Mass Evaluation... Please wait.\n")

    # 4. The Evaluation Loop
    with torch.no_grad(): 
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)

            running_corrects += torch.sum(preds == labels.data).item()
            total_images += inputs.size(0)

            # Calculate detailed stats
            for i in range(len(preds)):
                # Assuming index 1 is RG (Glaucoma) and 0 is NRG (Normal)
                if preds[i] == 1 and labels.data[i] == 1:
                    true_positives += 1
                elif preds[i] == 0 and labels.data[i] == 0:
                    true_negatives += 1
                elif preds[i] == 1 and labels.data[i] == 0:
                    false_positives += 1
                elif preds[i] == 0 and labels.data[i] == 1:
                    false_negatives += 1

    # 5. Calculate Final Math
    accuracy = (running_corrects / total_images) * 100

    # Print the Final Report Card
    print("="*50)
    print("             FINAL CLINICAL REPORT CARD")
    print("="*50)
    print(f"Total Images Tested: {total_images}")
    print(f"OVERALL ACCURACY:    {accuracy:.2f}%\n")
    
    print("--- Detailed Breakdown ---")
    print(f"True Positives  (Correctly spotted Glaucoma): {true_positives}")
    print(f"True Negatives  (Correctly spotted Normal):   {true_negatives}")
    print(f"False Positives (False Alarms):               {false_positives}")
    print(f"False Negatives (Missed Diagnoses):           {false_negatives}")
    print("="*50)

if __name__ == "__main__":
    evaluate_test_set()