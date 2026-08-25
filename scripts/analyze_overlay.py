from PIL import Image
import numpy as np

img = Image.open('public/frames/frame_0200.jpg')
arr = np.array(img)

# The image is 1440 width x 810 height
# The pill is centered horizontally, near the bottom
# Let's inspect the region y from 650 to 800, x from 550 to 900
sub = arr[680:790, 600:840]

# Dark pixels of the pill background are typically around (35, 38, 40)
mask = (sub[:, :, 0] < 60) & (sub[:, :, 1] < 60) & (sub[:, :, 2] < 60)
coords = np.argwhere(mask)

if len(coords) > 0:
    min_y, min_x = coords.min(axis=0)
    max_y, max_x = coords.max(axis=0)
    
    actual_min_y = 680 + min_y
    actual_max_y = 680 + max_y
    actual_min_x = 600 + min_x
    actual_max_x = 600 + max_x
    
    print(f"Pill detected at: X: [{actual_min_x}, {actual_max_x}], Y: [{actual_min_y}, {actual_max_y}]")
    print(f"Width: {actual_max_x - actual_min_x + 1}px, Height: {actual_max_y - actual_min_y + 1}px")
else:
    print("No dark pill detected in this sub-region")
