from pathlib import Path
p=Path('apps/web/src/pages/verify.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("const required = ['name','id','gender','birthday','job','income','purpose','address','relativePhone','relation'];", "const required = ['name','id','gender','birthday','job','income','purpose','address','relativeName','relativePhone','relation'];")
old=None
for line in s.splitlines():
    if 'name="relativePhone"' in line:
        old=line
        break
if old:
    new="          <Field name=\"relativeName\" placeholder=\"Tên người thân\" value={form.relativeName || ''} onChange={set} error={missing('relativeName')} />\n          <Field name=\"relativePhone\" placeholder=\"SĐT người thân\" value={form.relativePhone || ''} onChange={set} error={missing('relativePhone')} />"
    s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
