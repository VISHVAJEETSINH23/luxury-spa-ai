import cv2
import numpy as np

img1 = cv2.imread('public/frames/frame_0001.jpg')
h, w = img1.shape[:2]

mask1 = np.zeros((h, w), dtype=np.uint8)

# Exact Diamond Polygon for Gemini Star:
# Top: (1302, 658), Right: (1328, 684), Bottom: (1302, 710), Left: (1276, 684)
diamond_pts = np.array([
    [1302, 658],
    [1328, 684],
    [1302, 710],
    [1276, 684]
], np.int32)
cv2.fillPoly(mask1, [diamond_pts], 255)

# Dilate by only 2px for clean boundary
kernel = np.ones((3, 3), np.uint8)
mask1 = cv2.dilate(mask1, kernel, iterations=1)

# Inpaint
clean1 = cv2.inpaint(img1, mask1, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
cv2.imwrite('public/frames/verify_diamond_0001.jpg', clean1, [cv2.IMWRITE_JPEG_QUALITY, 95])
print("Saved verify_diamond_0001.jpg")
