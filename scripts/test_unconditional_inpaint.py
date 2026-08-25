import cv2
import numpy as np
from PIL import Image

# Let's test on several diverse frames across the video:
test_frames = [1, 50, 150, 250, 350, 450, 550, 650, 750, 840]

def test_clean_frame(frame_num):
    path = f'public/frames/frame_{frame_num:04d}.jpg'
    img = cv2.imread(path)
    if img is None:
        return
    h, w = img.shape[:2]
    
    # Combined master inpaint mask
    mask = np.zeros((h, w), dtype=np.uint8)
    
    # 1. Gemini Star (Bottom-Right): center cx=1302, cy=685, radius ~42px
    # Diamond / Circle mask
    cv2.circle(mask, (1302, 685), 44, 255, -1)
    
    # 2. Bottom-Center Pill: x1=644, x2=798, y1=694, y2=778
    # Rounded rectangle mask
    cv2.rectangle(mask, (644, 694), (798, 778), 255, -1)
    
    # 3. Top-Right Icon: x1=1380, x2=1435, y1=15, y2=65
    cv2.rectangle(mask, (1380, 15), (1435, 65), 255, -1)
    
    # Dilate mask slightly by 3px for seamless edge transition
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)
    
    # High-quality Navier-Stokes + Telea seamless inpainting
    inpainted = cv2.inpaint(img, mask, inpaintRadius=6, flags=cv2.INPAINT_TELEA)
    
    cv2.imwrite(f'public/frames/verify_sample_{frame_num:04d}.jpg', inpainted, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"Generated verify_sample_{frame_num:04d}.jpg")

for f in test_frames:
    test_clean_frame(f)
