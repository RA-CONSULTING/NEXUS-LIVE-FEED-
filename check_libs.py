import sys
try:
    import imageio
    print("imageio is available")
except ImportError:
    print("imageio is NOT available")

try:
    from PIL import Image
    print("PIL is available")
except ImportError:
    print("PIL is NOT available")
