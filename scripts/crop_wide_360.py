from PIL import Image
import numpy as np

img360 = Image.open('public/frames/frame_0360.jpg')
arr360 = np.array(img360)

# Let's crop:
# 1. Top center wide: y from 20 to 120, x from 650 to 790
top_center_wide = Image.fromarray(arr360[20:120, 650:790])
top_center_wide.save('public/frames/crop_top_center_wide.jpg')

# 2. Bottom right wide: y from 600 to 810, x from 1250 to 1440
br_wide = Image.fromarray(arr360[600:810, 1250:1440])
br_wide.save('public/frames/crop_br_wide.jpg')

print("Saved crop_top_center_wide.jpg and crop_br_wide.jpg")
