import cv2
import numpy as np

img = cv2.imread('public/frames/frame_0360.jpg')
arr = img.copy()

# Star region: x from 1270 to 1415, y from 635 to 760
X1, X2 = 1270, 1415
Y1, Y2 = 635, 760
h = Y2 - Y1
w = X2 - X1

# Isolate the bright/translucent star pixels using difference from local median
roi = arr[Y1:Y2, X1:X2]
gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
med = cv2.medianBlur(gray_roi, 25)
diff = cv2.absdiff(gray_roi, med)

# Star mask: where diff is noticeable or brightness is elevated
_, mask_roi = cv2.threshold(diff, 6, 255, cv2.THRESH_BINARY)
kernel = np.ones((5, 5), np.uint8)
dilated_roi = cv2.dilate(mask_roi, kernel, iterations=2)

full_mask = np.zeros(img.shape[:2], dtype=np.uint8)
full_mask[Y1:Y2, X1:X2] = dilated_roi

# Inpaint ONLY the star shape itself (Navier-Stokes)
clean_ns = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_NS)

crop = clean_ns[600:800, 1230:1440]
cv2.imwrite('public/frames/test_smart_ns_360.jpg', crop)
print("Saved test_smart_ns_360.jpg")
