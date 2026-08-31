from PIL import Image, ImageDraw

src = r'C:\Users\sayefate\Desktop\MadreseTelavat_APK\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png'
icon = Image.open(src).convert('RGBA')

def make_pwa_icon(size):
    # Dark brown/black background matching the APK icon appearance
    bg_color = (20, 10, 5, 255)  # very dark brown-black
    
    # Create background
    bg = Image.new('RGBA', (size, size), bg_color)
    
    # Add a subtle dark gradient feel by darkening edges slightly
    # (optional - skip if too complex, solid color is fine)
    
    # Resize icon to fit with padding (85% of canvas)
    icon_size = int(size * 0.85)
    padding = (size - icon_size) // 2
    icon_resized = icon.resize((icon_size, icon_size), Image.LANCZOS)
    
    # Paste icon on background using alpha mask
    bg.paste(icon_resized, (padding, padding), icon_resized)
    
    # Convert to RGB for PNG (no transparency needed for PWA icon)
    final = bg.convert('RGB')
    return final

# Save 192px
img192 = make_pwa_icon(192)
img192.save(r'C:\Users\sayefate\Desktop\naye-quran-pwa\icon-192.png', 'PNG')
print(f"icon-192.png: {__import__('os').path.getsize(r'C:\Users\sayefate\Desktop\naye-quran-pwa\icon-192.png')} bytes")

# Save 512px  
img512 = make_pwa_icon(512)
img512.save(r'C:\Users\sayefate\Desktop\naye-quran-pwa\icon-512.png', 'PNG')
print(f"icon-512.png: {__import__('os').path.getsize(r'C:\Users\sayefate\Desktop\naye-quran-pwa\icon-512.png')} bytes")

print("DONE - icons with dark background created")
