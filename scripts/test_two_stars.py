import cv2
import numpy as np

img = cv2.imread('public/frames/raw_0396.jpg')
h, w = img.shape[:2]

mask = np.zeros((h, w), dtype=np.uint8)

# Star 1 (Left Star)
star1 = np.array([
    [1282, 650],
    [1314, 682],
    [1282, 714],
    [1250, 682]
], np.int32)
cv2.fillPoly(mask, [star1], 255)

# Star 2 (Right Star - Larger)
star2 = np.array([
    [1358, 642],
    [1400, 688],
    [1358, 734],
    [1316, 688]
], np.int32)
cv2.fillPoly(mask, [star2], 255)

# Small text below right star
cv2.rectangle(mask, (1320, 730), (1405, 755), 255, -1)

# Dilate by 3px for perfect coverage
kernel = np.ones((5, 5), np.uint8)
mask = cv2.dilate(mask, kernel, iterations=1)

# Inpaint with Telea
clean = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

crop = clean[600:800, 1230:1440]
cv2.imwrite('public/frames/verify_two_stars_clean.jpg', crop)
print("Saved verify_two_stars_clean.jpg")
