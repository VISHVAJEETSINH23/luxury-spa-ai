import cv2
import numpy as np
import subprocess
import os

ffmpeg = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
video = os.path.join(os.path.dirname(__file__), '..', 'public', 'videos', 'alexa-spa-journey.mp4')
out_raw = os.path.join(os.path.dirname(__file__), '..', 'public', 'frames', 'raw_0396.jpg')

subprocess.run([
    ffmpeg, "-ss", "00:00:33.000", "-i", video,
    "-vframes", "1", "-vf", "scale=1440:810", "-qscale:v", "2", "-y", out_raw
], check=True)

img = cv2.imread(out_raw)
crop_raw = img[600:800, 1230:1440]
cv2.imwrite('public/frames/debug_raw_396_star.jpg', crop_raw)
print("Saved debug_raw_396_star.jpg")
