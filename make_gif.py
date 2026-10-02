from PIL import Image
from pathlib import Path
p=Path(r'C:\Users\X\.picoclaw\workspace\state\playwright-mcp\flow')
files=sorted(p.glob('*.png'))
frames=[]
for f in files:
    im=Image.open(f).convert('RGB').resize((390,844))
    frames.append(im)
out=p/'quy-trinh.gif'
frames[0].save(out, save_all=True, append_images=frames[1:], duration=1200, loop=0)
print(out)
