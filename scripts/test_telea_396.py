import cv2
import numpy as np

img = cv2.imread('public/frames/frame_0396.jpg')
arr = img.copy()

X1, X2 = 1260, 1425
Y1, Y2 = 630, 765

roi = arr[Y1:Y2, X1:X2]
gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
med = cv2.medianBlur(gray_roi, 31)
diff = cv2.absdiff(gray_roi, med)

_, mask_roi = cv2.threshold(diff, 5, 255, cv2.THRESH_BINARY)
kernel = np.ones((7, 7), np.uint8)
dilated_roi = cv2.dilate(mask_roi, kernel, iterations=2)

full_mask = np.zeros(img.shape[:2], dtype=np.uint8)
full_mask[Y1:Y2, X1:X2] = dilated_roi

# Inpainting with inpaintRadius=12 and TELEA
clean_telea = cv2.inpaint(img, full_mask, inpaintRadius=12, flags=cv2.INPAINT_TELEA)

crop = clean_telea[600:800, 1230:1440]
cv2.imwrite('public/frames/test_telea_396.jpg', crop)
print("Saved test_telea_396.jpg")
