from PIL import Image
import numpy as np

img = Image.open('public/frames/frame_0700.jpg')
arr = np.array(img)

# Crop region: y from 650 to 810, x from 1200 to 1440
sub = arr[650:810, 1200:1440]

# The star is bright white/light cyan
# Let's find pixels with high brightness relative to background
gray = sub.mean(axis=2)
# The star is visibly brighter than the surrounding water
print("Sub-image shape:", sub.shape)

# Let's inspect coordinates inside sub
# The star appears in the top-middle of this 160x240 crop
# That is y ~ 0 to 60 (y in full: 650 to 710), x ~ 60 to 140 (x in full: 1260 to 1340)
for y in range(0, 80):
    for x in range(50, 150):
        if gray[y, x] > np.median(gray) + 25:
            pass

# Let's pinpoint:
crop_star = Image.fromarray(sub[0:80, 50:160])
crop_star.save('public/frames/star_pinpoint.jpg')
print("Saved star_pinpoint.jpg")
