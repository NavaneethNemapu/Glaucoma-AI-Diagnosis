import torch
import torch.nn as nn
import torch.optim as optim
import time
import torch.nn.functional as F

# Import your custom scripts
from dataset import get_data_loaders
from model import get_glaucoma_model

# --- NEW: The Focal Loss Grader ---
class FocalLoss(nn.Module):
    def __init__(self, gamma=2.0):
        super(FocalLoss, self).__init__()
        self.gamma = gamma

    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        return focal_loss.mean()

def train_model(epochs=50): 
    # 1. Hardware Check
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Engine Status: ONLINE")
    print(f"Device: {device.type.upper()} (RTX 2050)")
    print(f"Epochs: {epochs}\n")

    # 2. Load the Augmented Conveyor Belt & the Brain
    # Note: These match the 'train' and 'validation' logic in dataset.py
    train_loader, val_loader, class_names = get_data_loaders(batch_size=16)
    model = get_glaucoma_model(num_classes=2).to(device)

    # 3. Setup the Grader, Optimizer, and Automatic Transmission
    criterion = FocalLoss(gamma=2.0)
        
    # We tell Adam to only look at parameters that are NOT frozen
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.0001) 
    
    # The Scheduler: If the accuracy stops improving for 3 epochs, drop the learning rate to 0.0001
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.1, patience=3)

    best_acc = 0.0

    # --- THE TRAINING LOOP ---
    for epoch in range(epochs):
        print(f"Epoch {epoch+1}/{epochs}")
        print("-" * 20)
        
        start_time = time.time()

        # Iterate through training and validation phases
        for phase in ['train', 'validation']:
            if phase == 'train':
                model.train()  
                dataloader = train_loader
            else:
                model.eval()   
                dataloader = val_loader

            # Reset the scoreboards for the current epoch
            running_loss = 0.0
            running_corrects = 0

            # 4. Feed the Batches to the GPU
            for inputs, labels in dataloader:
                inputs, labels = inputs.to(device), labels.to(device)

                # Clear the old math gradients from the previous step
                optimizer.zero_grad()

                # Only calculate calculus gradients if we are in the training phase
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    # Backpropagation and Adam Update
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                # Statistics
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = (running_corrects.double() / len(dataloader.dataset)) * 100

            print(f"{phase.capitalize()} Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.2f}%")

            # Save the model and check the transmission during the validation phase
            if phase == 'validation':
                if epoch_acc > best_acc:
                    best_acc = epoch_acc
                    torch.save(model.state_dict(), 'best_glaucoma_model.pth')
                    print(f">>> [NEW HIGH SCORE] {best_acc:.2f}% - Model saved.")
                
                # Tell the scheduler to check the current score and shift gears if needed
                scheduler.step(epoch_acc)
                
                # Print the current learning rate so you can watch the AI shift gears
                current_lr = optimizer.param_groups[0]['lr']
                print(f"Current Learning Rate: {current_lr}")

        epoch_time = time.time() - start_time
        print(f"Time: {epoch_time // 60:.0f}m {epoch_time % 60:.0f}s\n")

    print(f"Training Complete! Best Validation Accuracy: {best_acc:.2f}%")

if __name__ == "__main__":
    train_model(epochs=50)