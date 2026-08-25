import os
import glob
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor

frames_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'frames')
frame_files = sorted(glob.glob(os.path.join(frames_dir, 'frame_*.jpg')))

print(f"Removing Gemini logo across all {len(frame_files)} frames...")

# Gemini Star bounding box
Y1, Y2 = 646, 724
X1, X2 = 1260, 1344

def clean_frame(file_path):
    try:
        img = cv2.imread(file_path)
        if img is None:
            return
        
        h, w = img.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # Isolate the bright star watermark in ROI
        star_roi = img[Y1:Y2, X1:X2]
        gray_roi = cv2.cvtColor(star_roi, cv2.COLOR_BGR2GRAY)
        
        # Adaptive threshold for star pixels
        med = float(np.median(gray_roi))
        _, thresh = cv2.threshold(gray_roi, int(med + 18), 255, cv2.THRESH_BINARY)
        kernel = np.ones((5, 5), np.uint8)
        dilated = cv2.dilate(thresh, kernel, iterations=2)
        
        # If star pixels found, apply mask and inpaint
        if np.count_nonzero(dilated) > 15:
            mask[Y1:Y2, X1:X2] = dilated
            inpainted = cv2.inpaint(img, mask, inpaintRadius=6, flags=cv2.INPAINT_TELEA)
            cv2.imwrite(file_path, inpainted, [cv2.IMWRITE_JPEG_QUALITY, 95])
    except Exception as e:
        print(f"Error on {file_path}: {e}")

with ThreadPoolExecutor(max_workers=8) as executor:
    list(executor.map(clean_frame, frame_files))

print("Gemini star logo successfully removed across all 840 frames!")
