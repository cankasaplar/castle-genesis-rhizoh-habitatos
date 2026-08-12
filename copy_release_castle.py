import os
import shutil

root_dir = os.path.dirname(os.path.abspath(__file__))
rel_exe = os.path.join(root_dir, "target", "release", "castle.exe")
dest_exe = os.path.join(root_dir, "castle.exe")

if os.path.exists(rel_exe):
    shutil.copy2(rel_exe, dest_exe)
    print(f"✓ Copied release binary from {rel_exe} to {dest_exe}")
else:
    print(f"Release binary not found at {rel_exe}")
