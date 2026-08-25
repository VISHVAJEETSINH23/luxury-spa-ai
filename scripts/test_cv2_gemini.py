import cv2
import numpy as np

img = cv2.imread('public/frames/frame_0700.jpg')
h, w = img.shape[:2]

# Create a clean binary mask for the Gemini star logo at bottom right:
# Center is cx=1302, cy=684
# We can create a mask around (1265:1339, 650:720)
mask = np.zeros((h, w), dtype=np.uint8)

# The star is visibly brighter than surrounding background in the region
star_roi = img[650:720, 1265:1339]
gray_roi = cv2.cvtColor(star_roi, cv2.COLOR_BGR2GRAY)

# Threshold to isolate the bright star pixels + slight dilation
_, thresh = cv2.threshold(gray_roi, np.median(gray_roi) + 20, 255, cv2.THRESH_BINARY)
kernel = np.ones((5, 5), np.uint8)
dilated = cv2.dilate(thresh, kernel, iterations=2)

mask[650:720, 1265:1339] = dilated

# Seamless OpenCV Inpainting (INPAINT_TELEA / INPAINT_NS)
inpainted = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

# Save crop to verify
crop = inpainted[620:750, 1230:1370]
cv2.imwrite('public/frames/verify_cv2_clean.jpg', crop)
print("Saved verify_cv2_clean.jpg successfully!")
