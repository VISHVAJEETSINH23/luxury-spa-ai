from PIL import Image
import numpy as np

# Load Frame 360 (00:30) and Frame 396 (00:33)
img360 = Image.open('public/frames/frame_0360.jpg')
arr360 = np.array(img360)

# 1. Top center [X] icon inspection (y: 30 to 120, x: 670 to 770)
top_center = arr360[30:120, 670:770]
Image.fromarray(top_center).save('public/frames/debug_top_center.jpg')

# 2. Bottom right star inspection (y: 650 to 810, x: 1240 to 1440)
bottom_right = arr360[650:810, 1240:1440]
Image.fromarray(bottom_right).save('public/frames/debug_bottom_right_360.jpg')

print("Saved debug images for scene 2 (frame 360)")
