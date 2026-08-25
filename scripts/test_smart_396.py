import cv2
import numpy as np

img = cv2.imread('public/frames/frame_0396.jpg')
arr = img.copy()

# Star region: x from 1260 to 1420, y from 630 to 765
X1, X2 = 1260, 1420
Y1, Y2 = 630, 765

roi = arr[Y1:Y2, X1:X2]
gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
med = cv2.medianBlur(gray_roi, 25)
diff = cv2.absdiff(gray_roi, med)

_, mask_roi = cv2.threshold(diff, 6, 255, cv2.THRESH_BINARY)
kernel = np.ones((5, 5), np.uint8)
dilated_roi = cv2.dilate(mask_roi, kernel, iterations=2)

full_mask = np.zeros(img.shape[:2], dtype=np.uint8)
full_mask[Y1:Y2, X1:X2] = dilated_roi

# Bottom Pill (X: 644 to 798, Y: 694 to 778)
full_mask[694:778, 644:798] = 255

# Top Right Icon (X: 1380 to 1435, Y: 15 to 65)
full_mask[15:65, 1380:1435] = 255

clean_ns = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_NS)

crop = clean_ns[600:800, 1230:1440]
cv2.imwrite('public/frames/test_smart_ns_396.jpg', crop)
print("Saved test_smart_ns_396.jpg")
