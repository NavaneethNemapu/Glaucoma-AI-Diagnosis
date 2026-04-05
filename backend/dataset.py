import os
import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# --- CONFIGURATION ---
DATA_DIR = r"C:\Users\navan\Desktop\Sem-Project\backend\eyepac-light-v2-512-jpg"
BATCH_SIZE = 16

def get_data_loaders(batch_size=BATCH_SIZE):
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(p=0.5), 
            transforms.RandomRotation(degrees=15),
            # --- NEW: Force the AI to learn in bad lighting ---
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2), 
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'validation': transforms.Compose([ 
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # Load images (Matches your folder names: 'train' and 'validation')
    image_datasets = {
        x: datasets.ImageFolder(os.path.join(DATA_DIR, x), data_transforms[x])
        for x in ['train', 'validation']
    }

    dataloaders = {
        x: DataLoader(image_datasets[x], batch_size=batch_size, 
                       shuffle=True if x == 'train' else False, 
                       num_workers=0)
        for x in ['train', 'validation']
    }

    class_names = image_datasets['train'].classes
    return dataloaders['train'], dataloaders['validation'], class_names

if __name__ == "__main__":
    print("Testing the Augmented Conveyor Belt...")
    try:
        train_loader, val_loader, classes = get_data_loaders()
        print(f"[SUCCESS] Found folders: {classes}")
        print(f"Validation folder 'validation' is loaded and ready.")
    except Exception as e:
        print(f"[ERROR] Path check: {e}")