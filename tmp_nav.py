from pathlib import Path
files = {
 'apps/web/src/pages/dashboard.tsx': ('dashboard', "import MobileBottomNav from '../components/MobileBottomNav';\n"),
 'apps/web/src/pages/profile.tsx': ('profile', "import MobileBottomNav from '../components/MobileBottomNav';\n"),
 'apps/web/src/pages/loan-success.tsx': ('home', "import MobileBottomNav from '../components/MobileBottomNav';\n"),
}
for fp,(active,imp) in files.items():
    p=Path(fp); s=p.read_text(encoding='utf-8')
    if 'MobileBottomNav' not in s:
        s=s.replace("import ", imp+"import ", 1)
    import re
    s=re.sub(r'\s*<nav className="fixed bottom-0[\s\S]*?</nav>', f'\n        <MobileBottomNav active="{active}" />', s, count=1)
    s=re.sub(r'\nfunction NavItem\([\s\S]*?\n}\s*$', '\n', s, count=1)
    s=re.sub(r'\nfunction Bottom\([\s\S]*?\n}\s*$', '\n', s, count=1)
    p.write_text(s,encoding='utf-8')

# confirm: replace BottomNav function body with shared component import
p=Path('apps/web/src/pages/confirm-loan.tsx')
s=p.read_text(encoding='utf-8')
if 'MobileBottomNav' not in s:
    s=s.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport MobileBottomNav from '../components/MobileBottomNav';")
s=s.replace('<BottomNav />','<MobileBottomNav active="plus" />')
s=re.sub(r'\nfunction BottomNav\(\) \{[\s\S]*?\n}\s*$', '\n', s, count=1)
p.write_text(s,encoding='utf-8')
