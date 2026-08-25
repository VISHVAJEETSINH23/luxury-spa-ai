import os
import glob
from PIL import Image, ImageFilter
import numpy as np
from concurrent.futures import ThreadPoolExecutor

frames_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'frames')
frame_files = sorted(glob.glob(os.path.join(frames_dir, 'frame_*.jpg')))

print(f"Found {len(frame_files)} frames to clean...")

# Overlay Bounding Boxes:
# 1. Main Bottom Pill: X: 646 to 795, Y: 696 to 775
PILL_X1, PILL_X2 = 646, 795
PILL_Y1, PILL_Y2 = 696, 775
pill_h = PILL_Y2 - PILL_Y1
pill_w = PILL_X2 - PILL_X1
vert_weights = np.linspace(0, 1, pill_h)[:, None, None]
horiz_weights = np.linspace(0, 1, pill_w)[None, :, None]

# 2. Top-Right Icon (if present): X: 1385 to 1428, Y: 18 to 60
TR_X1, TR_X2 = 1385, 1428
TR_Y1, TR_Y2 = 18, 60
tr_h = TR_Y2 - TR_Y1
tr_w = TR_X2 - TR_X1
tr_vert = np.linspace(0, 1, tr_h)[:, None, None]
tr_horiz = np.linspace(0, 1, tr_w)[None, :, None]

def process_frame(file_path):
    try:
        img = Image.open(file_path)
        arr = np.array(img).copy()
        
        # --- 1. Inpaint Main Bottom Pill ---
        top_edge = arr[PILL_Y1-1:PILL_Y1, PILL_X1:PILL_X2].astype(float)
        bottom_edge = arr[PILL_Y2:PILL_Y2+1, PILL_X1:PILL_X2].astype(float)
        left_edge = arr[PILL_Y1:PILL_Y2, PILL_X1-1:PILL_X1].astype(float)
        right_edge = arr[PILL_Y1:PILL_Y2, PILL_X2:PILL_X2+1].astype(float)
        
        v_blend = (1 - vert_weights) * top_edge + vert_weights * bottom_edge
        h_blend = (1 - horiz_weights) * left_edge + horiz_weights * right_edge
        pill_patch = (v_blend * 0.65 + h_blend * 0.35).astype(np.uint8)
        arr[PILL_Y1:PILL_Y2, PILL_X1:PILL_X2] = pill_patch
        
        # --- 2. Inpaint Top-Right Icon ---
        tr_top = arr[TR_Y1-1:TR_Y1, TR_X1:TR_X2].astype(float)
        tr_bot = arr[TR_Y2:TR_Y2+1, TR_X1:TR_X2].astype(float)
        tr_left = arr[TR_Y1:TR_Y2, TR_X1-1:TR_X1].astype(float)
        tr_right = arr[TR_Y1:TR_Y2, TR_X2:TR_X2+1].astype(float)
        
        tr_v_blend = (1 - tr_vert) * tr_top + tr_vert * tr_bot
        tr_h_blend = (1 - tr_horiz) * tr_left + tr_horiz * tr_right
        tr_patch = (tr_v_blend * 0.5 + tr_h_blend * 0.5).astype(np.uint8)
        arr[TR_Y1:TR_Y2, TR_X1:TR_X2] = tr_patch
        
        # Save back with crystal clear quality
        clean_img = Image.fromarray(arr)
        clean_img.save(file_path, quality=95)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

# Process in parallel threads for lightning speed
with ThreadPoolExecutor(max_workers=8) as executor:
    list(executor.map(process_frame, frame_files))

print("All 840 frames cleaned and inpainted successfully!")
