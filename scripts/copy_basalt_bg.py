import os
import shutil

src_dir = r"C:\Users\HP\.gemini\antigravity-ide\brain\de6b64f9-e15c-488a-a242-83aa46c3694a"
dest_dir = r"d:\SPA 2\public\images"

shutil.copy(
    os.path.join(src_dir, "dark_basalt_luxury_bg_1787512168580.jpg"),
    os.path.join(dest_dir, "dark-basalt-bg.jpg")
)
print("Dark basalt background copied!")
