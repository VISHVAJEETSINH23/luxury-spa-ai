import cv2
import numpy as np
import subprocess
import os

ffmpeg = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
video = os.path.join(os.path.dirname(__file__), '..', 'public', 'videos', 'alexa-spa-journey.mp4')
out_raw = os.path.join(os.path.dirname(__file__), '..', 'public', 'frames', 'raw_0360.jpg')

subprocess.run([
    ffmpeg, "-ss", "00:00:30.000", "-i", video,
    "-vframes", "1", "-vf", "scale=1440:810", "-qscale:v", "2", "-y", out_raw
], check=True)

img = cv2.imread(out_raw)
X1, X2 = 1240, 1415
Y1, Y2 = 635, 765
roi = img[Y1:Y2, X1:X2]
gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

mask = (gray > (np.median(gray) + 12)).astype(np.uint8) * 255
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
dilated = cv2.dilate(mask, kernel, iterations=2)

full_mask = np.zeros(img.shape[:2], dtype=np.uint8)
full_mask[Y1:Y2, X1:X2] = dilated

clean = cv2.inpaint(img, full_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

crop = clean[580:810, 1200:1440]
cv2.imwrite('public/frames/verify_clean_perfect_360.jpg', crop)
print("Saved verify_clean_perfect_360.jpg")
