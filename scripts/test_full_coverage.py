import cv2
import numpy as np

# Test on frame 360 and frame 396
for f_num in [360, 396]:
    img = cv2.imread(f'public/frames/frame_{f_num:04d}.jpg')
    h, w = img.shape[:2]
    
    mask = np.zeros((h, w), dtype=np.uint8)
    
    # 1. Full-Coverage Gemini Star Mask (X: 1260 to 1415, Y: 630 to 765)
    cv2.rectangle(mask, (1260, 630), (1415, 765), 255, -1)
    
    # 2. Bottom Pill (X: 640 to 800, Y: 690 to 780)
    cv2.rectangle(mask, (640, 690), (800, 780), 255, -1)
    
    # 3. Top-Right Screen Icon (X: 1375 to 1435, Y: 15 to 70)
    cv2.rectangle(mask, (1375, 15), (1435, 70), 255, -1)
    
    # Smooth dilation
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)
    
    # Inpaint with Telea
    inpainted = cv2.inpaint(img, mask, inpaintRadius=7, flags=cv2.INPAINT_TELEA)
    
    # Save crop around the star region to inspect
    crop = inpainted[600:800, 1230:1440]
    cv2.imwrite(f'public/frames/test_full_coverage_{f_num}.jpg', crop)
    print(f"Saved test_full_coverage_{f_num}.jpg")
