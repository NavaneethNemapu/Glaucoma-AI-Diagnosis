import torch
import torch.nn as nn
from torchvision import models

def get_glaucoma_model(num_classes=2):
    print("Loading ResNet18 (Raw Data Challenge: Layer 4 Unfrozen)...")
    
    # 1. Download the pre-trained ResNet18 brain
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)

    # 2. Freeze the ENTIRE brain first (Layers 1, 2, and 3)
    for param in model.parameters():
        param.requires_grad = False

    # 3. UNFREEZE Layer 4 (Allowing the AI to learn deep medical textures)
    for param in model.layer4.parameters():
        param.requires_grad = True

    # 4. Chop off the final layer and attach our custom Glaucoma layer
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, num_classes)

    return model

# --- Quick Test Block ---
if __name__ == "__main__":
    ai_model = get_glaucoma_model(num_classes=2)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nHardware detected: {device.type.upper()}")
    ai_model = ai_model.to(device)
    print("\nSUCCESS! ResNet18 Layer 4 is unfrozen and ready for raw data.")