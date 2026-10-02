from pathlib import Path
root = Path('apps/web/src/pages')
changes = {
  'choose-loan.tsx': [("import { ArrowLeft, ChevronDown } from 'lucide-react';", "import { ArrowLeft, ChevronDown } from 'lucide-react';\nimport CustomerFooter from '../components/CustomerFooter';"), ("        {open && <div", "        <CustomerFooter />\n\n        {open && <div")],
  'verify.tsx': [("import Link from 'next/link';", "import Link from 'next/link';\nimport CustomerFooter from '../components/CustomerFooter';"), ("        </form>\n      </div>", "        </form>\n        <CustomerFooter />\n      </div>")],
  'kyc.tsx': [("import { Header } from './verify';", "import { Header } from './verify';\nimport CustomerFooter from '../components/CustomerFooter';"), ("        </div>\n      </div>", "        </div>\n        <CustomerFooter />\n      </div>")],
  'bank-info.tsx': [("import Link from 'next/link';", "import Link from 'next/link';\nimport CustomerFooter from '../components/CustomerFooter';"), ("      </div>\n    </main>", "        <CustomerFooter />\n      </div>\n    </main>")],
  'confirm-loan.tsx': [("import Link from 'next/link';", "import Link from 'next/link';\nimport CustomerFooter from '../components/CustomerFooter';"), ("      </div>\n    </main>", "        <CustomerFooter />\n      </div>\n    </main>")],
  'loan-success.tsx': [("import MobileBottomNav from '../components/MobileBottomNav';", "import MobileBottomNav from '../components/MobileBottomNav';\nimport CustomerFooter from '../components/CustomerFooter';"), ("        <MobileBottomNav active=\"home\" />", "        <CustomerFooter />\n        <MobileBottomNav active=\"home\" />")],
}
for name, reps in changes.items():
    p = root / name
    s = p.read_text(encoding='utf-8-sig')
    for old, new in reps:
        if old not in s:
            raise SystemExit(f'Missing pattern in {name}: {old!r}')
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
print('patched footer pages:', ', '.join(changes))
