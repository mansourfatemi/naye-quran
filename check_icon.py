from PIL import Image
img = Image.open(r'C:\Users\sayefate\Desktop\MadreseTelavat_APK\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png')
print(f"Size: {img.size}")
print(f"Mode: {img.mode}")
# Check corners for background color
px = img.convert('RGBA')
print(f"Top-left corner pixel: {px.getpixel((0,0))}")
print(f"Top-right corner pixel: {px.getpixel((img.width-1, 0))}")
print(f"Bottom-left corner pixel: {px.getpixel((0, img.height-1))}")
print(f"Center pixel: {px.getpixel((img.width//2, img.height//2))}")
