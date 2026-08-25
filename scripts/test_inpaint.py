from PIL import Image, ImageFilter
import numpy as np

# Load test frame
img = Image.open('public/frames/frame_0200.jpg')
arr = np.array(img).copy()

# Bounding box of the pill with a 6px safety margin
# x: 648 to 793, y: 698 to 773
x1, x2 = 648, 793
y1, y2 = 698, 773

# Method 1: Clean seamless horizontal/vertical texture blending from surrounding floor pixels
h = y2 - y1
w = x2 - x1

# Sample surrounding borders
top_edge = arr[y1-1:y1, x1:x2].astype(float)
bottom_edge = arr[y2:y2+1, x1:x2].astype(float)
left_edge = arr[y1:y2, x1-1:x1].astype(float)
right_edge = arr[y1:y2, x2:x2+1].astype(float)

# Create 2D vertical gradient blend
vert_weights = np.linspace(0, 1, h)[:, None, None]
horiz_weights = np.linspace(0, 1, w)[None, :, None]

vert_blend = (1 - vert_weights) * top_edge + vert_weights * bottom_edge
horiz_blend = (1 - horiz_weights) * left_edge + horiz_weights * right_edge

# Harmonized smooth inpaint patch
patch = (vert_blend * 0.65 + horiz_blend * 0.35).astype(np.uint8)
arr[y1:y2, x1:x2] = patch

# Apply slight smooth blur on the seam edges for perfect blend
result = Image.fromarray(arr)
# Create a mask for subtle feathering
mask = Image.new('L', (1440, 810), 0)
mask_arr = np.array(mask)
mask_arr[y1-2:y2+2, x1-2:x2+2] = 255
feather_mask = Image.fromarray(mask_arr).filter(ImageFilter.GaussianBlur(3))

blurred_result = result.filter(ImageFilter.GaussianBlur(1))
final_img = Image.composite(blurred_result, result, feather_mask)

final_img.save('public/frames/test_fixed_0200.jpg', quality=95)
print("Saved test_fixed_0200.jpg successfully!")
