import cv2
import numpy as np

img = cv2.imread('public/frames/raw_0396.jpg')
X1, X2 = 1240, 1415
Y1, Y2 = 635, 765
roi = img[Y1:Y2, X1:X2]
gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

print("Min:", gray.min(), "Max:", gray.max(), "Mean:", gray.mean(), "Median:", np.median(gray))

# The background on the wall is around 35-45. The stars are 90-140!
# So any pixel above median + 12 is star!
mask = (gray > (np.median(gray) + 12)).astype(np.uint8) * 255

# Dilate by 5px so the entire star including curved tips and anti-aliasing is covered
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
dilated = cv2.dilate(mask, kernel, iterations=2)

full_mask = np.zeros(img.shape[:2], dtype=np.uint8)
full_mask[Y1:Y2, X1:X2] = dilated

# Inpaint with inpaintRadius=5 Telea
clean = cv2.inpaint(img, full_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

crop = clean[580:810, 1200:1440]
cv2.imwrite('public/frames/verify_clean_perfect_396.jpg', crop)
print("Saved verify_clean_perfect_396.jpg")
