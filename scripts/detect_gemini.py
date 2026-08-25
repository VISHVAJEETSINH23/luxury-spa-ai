from PIL import Image
import numpy as np

img = Image.open('public/frames/frame_0001.jpg')
arr = np.array(img)

# The image is 1440 width x 810 height
# Gemini star is in the bottom right corner (y: ~750 to 805, x: ~1240 to 1340)
# Let's inspect bottom right region: y from 720 to 810, x from 1200 to 1440
sub = arr[740:805, 1240:1350]

# The sparkle is brighter / whitish with a subtle gradient
# Let's find coordinates where bright pixels stand out or inspect the region
print("Searching for Gemini sparkle icon...")

# Let's inspect frame 700 where sparkle was visible
img700 = Image.open('public/frames/frame_0700.jpg')
arr700 = np.array(img700)
# Look at bottom-right corner of frame 700:
# In frame 700, the sparkle was around x: 1250-1320, y: 770-805 or y: 640-720
sub700 = arr700[720:805, 1240:1350]

# Let's check brightness difference
print("Frame shape:", arr.shape)
