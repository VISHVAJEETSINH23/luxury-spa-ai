import cv2
import numpy as np

img = cv2.imread('public/frames/raw_0396.jpg')
h, w = img.shape[:2]

mask = np.zeros((h, w), dtype=np.uint8)

# Entire 2-Star + Text Watermark Box
mask[635:765, 1240:1415] = 255

clean_telea = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

crop = clean_telea[580:810, 1200:1440]
cv2.imwrite('public/frames/verify_rect_telea_396.jpg', crop)
print("Saved verify_rect_telea_396.jpg")
