from PIL import Image
import numpy as np

img = Image.open('public/frames/frame_0700.jpg')
arr = np.array(img)

# Crop bottom right corner:
# y from 650 to 810, x from 1200 to 1440
crop = Image.fromarray(arr[650:810, 1200:1440])
crop.save('public/frames/test_gemini_crop.jpg')
print("Saved test_gemini_crop.jpg")
