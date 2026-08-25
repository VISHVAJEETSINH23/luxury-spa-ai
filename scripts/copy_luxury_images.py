import os
import shutil

src_dir = r"C:\Users\HP\.gemini\antigravity-ide\brain\de6b64f9-e15c-488a-a242-83aa46c3694a"
dest_dir = r"d:\SPA 2\public\images"

os.makedirs(dest_dir, exist_ok=True)

# Find generated images
shutil.copy(os.path.join(src_dir, "sanctuary_philosophy_bedrock_1787511779885.jpg"), os.path.join(dest_dir, "philosophy-sanctuary.jpg"))
shutil.copy(os.path.join(src_dir, "ritual_basalt_hot_stones_1787511796295.jpg"), os.path.join(dest_dir, "ritual-basalt.jpg"))
shutil.copy(os.path.join(src_dir, "suite_horizon_villa_1787511814981.jpg"), os.path.join(dest_dir, "suite-horizon.jpg"))

print("Luxury images copied successfully to public/images/")
