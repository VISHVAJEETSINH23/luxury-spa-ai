import cv2
import numpy as np

img = cv2.imread('public/frames/raw_0396.jpg')
h, w = img.shape[:2]

# Star Zone
X1, X2 = 1240, 1415
Y1, Y2 = 635, 765

roi = img[Y1:Y2, X1:X2]
gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

# Find background luminance baseline with large blur
bg_blur = cv2.GaussianBlur(gray_roi, (31, 31), 0)

# Positive difference: where pixels are brighter than background
bright_diff = cv2.subtract(gray_roi, bg_blur)

# Threshold to isolate the two white stars and text cleanly
_, star_mask_roi = cv2.threshold(bright_diff, 8, 255, cv2.THRESH_BINARY)

# Dilate by 3px to cover anti-aliased edges
kernel = np.ones((5, 5), np.uint8)
star_mask_roi = cv2.dilate(star_mask_roi, kernel, iterations=1)

full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[Y1:Y2, X1:X2] = star_mask_roi

# Inpaint with Navier-Stokes (smooth gradient preservation)
clean_smart = cv2.inpaint(img, full_mask, inpaintRadius=3, flags=cv2.INPAINT_NS)

crop = clean_smart[580:810, 1200:1440]
cv2.imwrite('public/frames/verify_smart_clean_396.jpg', crop)
print("Saved verify_smart_clean_396.jpg")
