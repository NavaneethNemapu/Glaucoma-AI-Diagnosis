import cv2
import os
from pathlib import Path

# 1. Define your exact Windows paths
RAW_DATA_DIR = r"C:\Users\navan\Desktop\Sem-Project\eyepac-light-v2-512-jpg"
CLEAN_DATA_DIR = r"C:\Users\navan\Desktop\Sem-Project\cleaned_dataset"
TARGET_SIZE = (224, 224) # ResNet18 standard

def process_image(img_path, save_path):
    # Load image
    img = cv2.imread(str(img_path))
    if img is None:
        return

    # Resize
    resized = cv2.resize(img, TARGET_SIZE)

    # Apply CLAHE
    lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    final_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    # Save to the new folder
    cv2.imwrite(str(save_path), final_img)

def run_batch_pipeline():
    print(f"Starting pipeline...\nReading from: {RAW_DATA_DIR}\nSaving to: {CLEAN_DATA_DIR}\n")
    
    # Track progress
    processed_count = 0
    
    # Walk through every folder (train, test, NRG, RG)
    for root, dirs, files in os.walk(RAW_DATA_DIR):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                
                raw_img_path = Path(root) / file
                
                # Figure out the relative path so we keep the exact same folder structure
                relative_path = raw_img_path.relative_to(RAW_DATA_DIR)
                save_img_path = Path(CLEAN_DATA_DIR) / relative_path
                
                # Make sure the target sub-folders exist (e.g., cleaned_dataset/train/NRG)
                save_img_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Process and save
                process_image(raw_img_path, save_img_path)
                
                processed_count += 1
                if processed_count % 500 == 0:
                    print(f"Processed {processed_count} images so far...")

    print(f"\nSUCCESS! {processed_count} images have been cleaned and saved to: {CLEAN_DATA_DIR}")

if __name__ == "__main__":
    run_batch_pipeline()