from PIL import Image, ImageFilter
import numpy as np

img = Image.open('public/frames/frame_0700.jpg')
arr = np.array(img).copy()

# Center of the Gemini star: cx = 1302, cy = 684
# Star radius ~ 25px
X1, X2 = 1276, 1328
Y1, Y2 = 658, 710
h = Y2 - Y1
w = X2 - X1

top_edge = arr[Y1-1:Y1, X1:X2].astype(float)
bottom_edge = arr[Y2:Y2+1, X1:X2].astype(float)
left_edge = arr[Y1:Y2, X1-1:X1].astype(float)
right_edge = arr[Y1:Y2, X2:X2+1].astype(float)

v_weights = np.linspace(0, 1, h)[:, None, None]
h_weights = np.linspace(0, 1, w)[None, :, None]

v_blend = (1 - v_weights) * top_edge + v_weights * bottom_edge
h_blend = (1 - h_weights) * left_edge + h_weights * right_edge
patch = (v_blend * 0.5 + h_blend * 0.5)

# Create soft radial mask for the star region
y_indices, x_indices = np.ogrid[:h, :w]
cy, cx = h / 2.0, w / 2.0
# Normalized distance from center
dist = np.sqrt(((y_indices - cy) / (h / 2.0))**2 + ((x_indices - cx) / (w / 2.0))**2)
# Smooth cosine/sigmoid falloff
alpha_mask = np.clip(1.0 - dist, 0.0, 1.0)
alpha_mask = np.sin(alpha_mask * np.pi / 2.0)**2
alpha_mask = alpha_mask[:, :, None]

orig_patch = arr[Y1:Y2, X1:X2].astype(float)
blended = orig_patch * (1 - alpha_mask) + patch * alpha_mask
arr[Y1:Y2, X1:X2] = blended.astype(np.uint8)

clean_test = Image.fromarray(arr)
# Crop the region to verify
verify_crop = Image.fromarray(arr[620:750, 1230:1370])
verify_crop.save('public/frames/verify_gemini_feathered.jpg')
print("Saved verify_gemini_feathered.jpg")
