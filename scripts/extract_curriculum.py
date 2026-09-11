"""Rebuild the source index from pdftotext -layout output; no textbook text shipped."""
from pathlib import Path
import re,json,sys,hashlib
root=Path(sys.argv[1] if len(sys.argv)>1 else '../source-extract')
topics=['Quantitative Methods','Economics','Corporate Issuers','Financial Statement Analysis','Equity Investments','Fixed Income','Derivatives','Alternative Investments','Portfolio Management','Ethical and Professional Standards']
colors=['#57c7ff','#f7b955','#bf9aff','#f083a7','#72d6b0','#72a7ff','#f59770','#b6cf73','#77cbd1','#ded08a']
index=[]; excerpts=[]
for v,title in enumerate(topics,1):
 pages=(root/f'cfa-program2026L1V{v}.txt').read_text().split('\f')[:-1]
 starts=[]
 for n,p in enumerate(pages):
  m=re.search(r'LEARNING MODULE\s+(\d+)\s+(.+?)(?=\n\s*by |\n\s*LEARNING OUTCOMES|\n\s*APPENDI)',p,re.S)
  if m and m.start()<700:
   name=' '.join(m[2].split())
   starts.append({'number':int(m[1]),'title':name,'pdfPage':n+1})
 # Module titles / section headings from contents, handles wrapped title.
 toc=[]; pending=''
 for p in pages[:starts[0]['pdfPage']-1]:
  for line in p.splitlines():
   if re.match(r'^Learning Module \d+',line): pending=line.strip()
   elif pending: pending+=' '+line.strip()
   else: continue
   mat=re.match(r'Learning Module (\d+)\s+(.+?)\s+(\d+)\s*$',pending)
   if mat:
    toc.append({'number':int(mat[1]),'title':mat[2].strip(),'printedPage':int(mat[3])}); pending=''
 mods=[]
 for j,s in enumerate(starts):
  t=next((x for x in toc if x['number']==s['number']),None)
  if t:s.update(t)
  end=starts[j+1]['pdfPage']-1 if j+1<len(starts) else len(pages)
  start=s['pdfPage']; s['endPdfPage']=end
  s['id']=f'v{v}-m{s["number"]}';s['topicId']=f'v{v}';s['supplement']=s['title'].startswith('Appendices')
  # Extract all TOC section entries within the module; references not reproduced chapters.
  block='\n'.join(pages[:starts[0]['pdfPage']-1]); mm=re.search(r'^Learning Module '+str(s['number'])+r'\s+.*?(?=^Learning Module |\Z)',block,re.M|re.S)
  sections=[];buf=''
  if mm:
   for line in mm[0].splitlines()[1:]:
    line=line.strip()
    if not line or '©' in line or 'Contents' in line:continue
    mat=re.match(r'(.+?)\s+(\d+)\s*$',line)
    if mat:
     name=(buf+' '+mat[1]).strip();buf=''
     if name not in ['Practice Problems','Solutions','References','Glossary'] and len(name)>3:
      sections.append({'title':name,'printedPage':int(mat[2]),'pdfPage':int(mat[2])+start-s.get('printedPage',3)})
    elif not re.fullmatch('[ivx]+',line):buf+=' '+line
  s['sections']=sections
  # Internal LOS and overview evidence, not large source excerpts in deliverable.
  opening='\n'.join(pages[start-1:min(start+1,end)])
  los=re.search(r'The candidate should be able to:(.*?)(?:\n\s*INTRODUCTION|\n\s*LEARNING MODULE OVERVIEW)',opening,re.S)
  excerpt={'id':s['id'],'title':s['title'],'pages':f'{start}-{end}','los':los[1].strip()[:8000] if los else '', 'overview':opening[-3500:]}
  excerpts.append(excerpt)
  mods.append(s)
 index.append({'id':f'v{v}','volume':v,'title':title,'color':colors[v-1],'file':f'cfa-program2026L1V{v}.pdf','pages':len(pages),'modules':mods})
Path('src/data/curriculum.json').write_text(json.dumps(index,ensure_ascii=False,indent=2))
Path('../source-extract/module-evidence.json').write_text(json.dumps(excerpts,ensure_ascii=False,indent=2))
print(json.dumps([{'v':t['volume'],'modules':[(m['number'],m['title'],m['pdfPage']) for m in t['modules']]} for t in index],indent=2))
