#!/bin/sh -e
#
# Download Wikipedia backups (page and langlinks tables)
# convert them from MySQL to SQLite syntax and import them
# into SQLite databases.
#
# Requirements: wget awk gzip sed sqlite3

MIRROR_URL=https://ftp.acc.umu.se/mirror/wikimedia.org
BACKUP_DATE=20230720

LANGUAGES="en ceb sv de fr nl ru it es pl war vi ja zh ar pt \
uk fa ca sr no id ko fi hu sh cs ro eu tr ms \
eo hy bg he da ce sk kk min hr et lt be azb arz el \
sl gl az simple ur nn hi th ka uz la ta vo cy mk tg \
lv ast mg af tt oc bn bs ky sq new tl te \
ml br pms nds su ht lb jv sco mr sw pnb ga szl ba is \
my fy cv lmo an ne pa yo bar wuu io gu als ku scn kn \
ckb bpy ia qu vec mn wa or si cdo gd yi am nap \
ilo bug xmf hsb mai diq fo mzn sd li nv eml sah \
os sa ps ace frr mrj mhr hif bcl hak pam \
nso km hyw se rue mi vls crh bh nah shn sc gan vep \
as ab glk bo myv co so tk kv lrc csb sn gv udm \
ie zea ha pcd ay kab nrm ug lez stq kw haw mwl lfn gn \
gom lij rm lo lad frp koi mt fur dsb dty olo ang ext ln \
dv bjn ksh gor gag pfl sat pi pag av ban bxr xal \
tyv krc za pap kaa pdc rw szy to nov kl arc jam tpi kbp \
kbd tet ig wo zu ki na tcy jbo inh lbe bi ty kg \
mdf lg atj srn xh gcr ltg fj chr sm got ak pih om tn \
cu tw ts st rmy bm chy rn tum nqo ny ch ss mnw pnt ady \
iu ks ve ee ik sg ff dz ti din cr"

for L in $LANGUAGES
do
  echo Downloading tables for $L
  wget -nv $MIRROR_URL/dumps/"$L"wiki/$BACKUP_DATE/"$L"wiki-$BACKUP_DATE-page.sql.gz
  wget -nv $MIRROR_URL/dumps/"$L"wiki/$BACKUP_DATE/"$L"wiki-$BACKUP_DATE-langlinks.sql.gz
  echo Uncompressing tables for $L
  gzip -d "$L"wiki-$BACKUP_DATE-page.sql.gz
  gzip -d "$L"wiki-$BACKUP_DATE-langlinks.sql.gz
  sed -i '/UNIQUE KEY/d' "$L"wiki-$BACKUP_DATE-page.sql
  DATABASE="$L".sqlite
  echo Importing data into database $DATABASE
  `dirname "$0"`/mysql2sqlite "$L"wiki-$BACKUP_DATE-page.sql | sqlite3 -bail $DATABASE
  `dirname "$0"`/mysql2sqlite "$L"wiki-$BACKUP_DATE-langlinks.sql | sqlite3 -bail $DATABASE
  echo Removing table files
  rm "$L"wiki-$BACKUP_DATE-page.sql "$L"wiki-$BACKUP_DATE-langlinks.sql
done

