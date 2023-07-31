#!/usr/bin/env python3
"""Create data set of entity pairs between languages."""

import sys
import json
import sqlite3
import logging
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Tuple, TextIO, Optional


parser = argparse.ArgumentParser(description=sys.modules[__name__].__doc__, formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('input_dir', type=Path, help='Input directory with Wikipedia SQLite databases')
parser.add_argument('output_dir', type=Path, help='Output directory')
parser.add_argument('-l', '--languages', help='Languages to search pairs of entities in',
                    default='en,ceb,sv,de,fr,nl,ru,it,es,pl,war,vi,ja,zh,ar,pt,'
                    'uk,fa,ca,sr,no,id,ko,fi,hu,sh,cs,ro,eu,tr,ms,'
                    'eo,hy,bg,he,da,ce,sk,kk,min,hr,et,lt,be,azb,arz,el,'
                    'sl,gl,az,simple,ur,nn,hi,th,ka,uz,la,ta,vo,cy,mk,tg,'
                    'lv,ast,mg,af,tt,oc,bn,bs,ky,sq,new,tl,te,'
                    'ml,br,pms,nds,su,ht,lb,jv,sco,mr,sw,pnb,ga,szl,ba,is,'
                    'my,fy,cv,lmo,an,ne,pa,yo,bar,wuu,io,gu,als,ku,scn,kn,'
                    'ckb,bpy,ia,qu,vec,mn,wa,or,si,cdo,gd,yi,am,nap,'
                    'ilo,bug,xmf,hsb,mai,diq,fo,mzn,sd,li,nv,eml,sah,'
                    'os,sa,ps,ace,frr,mrj,mhr,hif,bcl,hak,pam,'
                    'nso,km,hyw,se,rue,mi,vls,crh,bh,nah,shn,sc,gan,vep,'
                    'as,ab,glk,bo,myv,co,so,tk,kv,lrc,csb,sn,gv,udm,'
                    'ie,zea,ha,pcd,ay,kab,nrm,ug,lez,stq,kw,haw,mwl,lfn,gn,'
                    'gom,lij,rm,lo,lad,frp,koi,mt,fur,dsb,dty,olo,ang,ext,ln,'
                    'dv,bjn,ksh,gor,gag,pfl,sat,pi,pag,av,ban,bxr,xal,'
                    'tyv,krc,za,pap,kaa,pdc,rw,szy,to,nov,kl,arc,jam,tpi,kbp,'
                    'kbd,tet,ig,wo,zu,ki,na,tcy,jbo,inh,lbe,bi,ty,kg,'
                    'mdf,lg,atj,srn,xh,gcr,ltg,fj,chr,sm,got,ak,pih,om,tn,'
                    'cu,tw,ts,st,rmy,bm,chy,rn,tum,nqo,ny,ch,ss,mnw,pnt,ady,'
                    'iu,ks,ve,ee,ik,sg,ff,dz,ti,din,cr')
parser.add_argument('-x', '--max_pair_count', type=int, help='Maximum translation pairs per file', default=100000)
parser.add_argument('-n', '--min_pair_count', type=int, help='Minimum translation pairs per language', default=10)
args = parser.parse_args()

logging.basicConfig(format='%(asctime)s %(levelname)-8s %(message)s', level=logging.DEBUG)

def create_next_translation_file(output_dir: Path, l1: str, l2: str, file: Optional[TextIO] = None) -> Tuple[Path, TextIO]:
    if file is not None:
        file.close()
    language_pair_dir = output_dir.joinpath(l1, l2)
    language_pair_dir.mkdir(0o755, parents=True, exist_ok=True)
    index = 0
    while True:
        path = language_pair_dir / '{l1}-{l2}-{i}.txt'.format(l1=l1, l2=l2, i=index)
        if not path.exists():
            return path, path.open('w', encoding='utf-8')
        index += 1

manifest = defaultdict(dict)
languages = args.languages.split(',')
logging.debug('Languages: {languages}'.format(languages=languages))
for language in languages:
    logging.info('Processing {language}'.format(language=language))
    # The direction in Wikipedia tables is backwards, so we must work
    # from the the destination language to source language
    with sqlite3.connect(args.input_dir / '{language}.sqlite'.format(language=language)) as conn:
        conn.text_factory = lambda b: b.decode(errors='ignore')  # This ensures text values returned come as string
        other_languages = [
            other for other, in conn.execute('SELECT DISTINCT ll_lang FROM langlinks LEFT JOIN page '
                                             'ON ll_from = page_id WHERE page_namespace = 0') if other in languages
        ]
        logging.debug('Available translations from: {others}'.format(others=str(other_languages)))
        for other_language in other_languages:
            logging.info('Processing translations from {l1} to {l2}'.format(l1=other_language, l2=language))
            pair_count, = conn.execute('SELECT COUNT(*) FROM langlinks LEFT JOIN page ON ll_from = page_id '
                                       'WHERE ll_lang=? AND page_namespace=0', (other_language,)).fetchone()
            if pair_count < args.min_pair_count:
                continue
            file_path, file = create_next_translation_file(args.output_dir, other_language, language)
            file_pair_count = 0
            files = [file_path.name]
            logging.debug('Output to {name}'.format(name=file_path.name))
            for pair in conn.execute('SELECT ll_title, REPLACE(page_title, "_", " ") FROM langlinks LEFT JOIN page '
                                     'ON ll_from = page_id WHERE ll_lang=? AND page_namespace=0', (other_language,)):
                print('\t'.join(map(str, pair)), file=file)
                # Check if new file is needed for new translation pairs
                file_pair_count += 1
                if file_pair_count > args.max_pair_count:
                    file.close()
                    file_path, file = create_next_translation_file(args.output_dir, other_language, language, file)
                    file_pair_count = 0
                    files.append(file_path.name)
                    logging.debug('Output to {name}'.format(name=file_path.name))
            file.close()
            manifest[other_language][language] = {
                'pairs': pair_count,
                'files': files
            }

logging.info('Writing manifest')
with open(args.output_dir / 'manifest.json', 'w', encoding='utf-8') as manifest_file:
    json.dump(manifest, manifest_file, ensure_ascii=False, sort_keys=True, indent=4)
