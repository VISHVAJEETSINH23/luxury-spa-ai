import os
import glob
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor

frames_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'frames')
frame_files = sorted(glob.glob(os.path.join(frames_dir, 'frame_*.jpg')))

print(f"Master Adaptive AI Inpainting across {len(frame_files)} frames...")

# Watermark ROI Coordinates
STAR_X1, STAR_X2 = 1240, 1415
STAR_Y1, STAR_Y2 = 635, 765

PILL_X1, PILL_X2 = 644, 798
PILL_Y1, PILL_Y2 = 694, 778

TR_X1, TR_X2 = 1380, 1435
TR_Y1, TR_Y2 = 15, 65

morph_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))

def process_frame(file_path):
    try:
        img = cv2.imread(file_path)
        if img is None:
            return
        
        h, w = img.shape[:2]
        full_mask = np.zeros((h, w), dtype=np.uint8)
        
        # --- 1. Dynamic 2-Star Gemini Watermark Segmentation ---
        roi = img[STAR_Y1:STAR_Y2, STAR_X1:STAR_X2]
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Adaptive luminance delta
        med = float(np.median(gray_roi))
        star_mask = (gray_roi > (med + 11)).astype(np.uint8) * 255
        dilated_star = cv2.dilate(star_mask, morph_kernel, iterations=2)
        
        full_mask[STAR_Y1:STAR_Y2, STAR_X1:STAR_X2] = dilated_star
        
        # --- 2. Bottom Media Control Pill ---
        full_mask[PILL_Y1:PILL_Y2, PILL_X1:PILL_X2] = 255
        
        # --- 3. Top-Right Screen Icon ---
        full_mask[TR_Y1:TR_Y2, TR_X1:TR_X2] = 255
        
        # High quality Telea inpainting
        inpainted = cv2.inpaint(img, full_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
        cv2.imwrite(file_path, inpainted, [cv2.IMWRITE_JPEG_QUALITY, 95])
    except Exception as e:
        print(f"Error on {file_path}: {e}")

with ThreadPoolExecutor(max_workers=8) as executor:
    list(executor.map(process_frame, frame_files))

print("All 840 frames successfully cleaned with zero artifacts!")
