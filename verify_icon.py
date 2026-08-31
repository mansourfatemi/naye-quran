from PIL import Image
img = Image.open(r'C:\Users\sayefate\Desktop\naye-quran-pwa\icon-192.png')
print(f"Size: {img.size}")
print(f"Mode: {img.mode}")
px = img.convert('RGBA')
print(f"Top-left: {px.getpixel((0,0))}")
print(f"Center: {px.getpixel((96,96))}")
print(f"Top-right: {px.getpixel((191,0))}")
# Save a test HTML to preview
with open(r'C:\Users\sayefate\Desktop\icon_preview.html', 'w') as f:
    f.write('<html><body style="background:#333"><img src="C:/Users/sayefate/Desktop/naye-quran-pwa/icon-192.png" style="width:192px"><br><img src="C:/Users/sayefate/Desktop/naye-quran-pwa/icon-512.png" style="width:192px"></body></html>')
print("Preview: C:/Users/sayefate/Desktop/icon_preview.html")
