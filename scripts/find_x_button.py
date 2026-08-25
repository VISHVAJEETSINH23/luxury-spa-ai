from PIL import Image
import numpy as np

img360 = Image.open('public/frames/frame_0360.jpg')
arr360 = np.array(img360)

# The user screenshot showed [X] at the top center.
# Let's crop the entire top strip y from 0 to 120, x from 0 to 1440 in 3 pieces:
left_top = Image.fromarray(arr360[0:120, 0:480])
mid_top = Image.fromarray(arr360[0:120, 480:960])
right_top = Image.fromarray(arr360[0:120, 960:1440])

mid_top.save('public/frames/debug_mid_top_360.jpg')
print("Saved debug_mid_top_360.jpg")
