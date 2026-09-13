from pathlib import Path
p=Path('scripts/build-rebus-productive-bank-wave4-preselection.mjs')
s=p.read_text()
old="const represented=new Set([...bank.values()].filter(serious).map(s=>normalizeIPA(s.ipa)));"
new="const seriousRepresented=new Set([...bank.values()].filter(serious).map(s=>normalizeIPA(s.ipa)));\nconst alreadyIndexed=new Set([...bank.keys()].map(normalizeIPA));"
if old not in s: raise SystemExit('represented declaration not found')
s=s.replace(old,new,1)
old2="const reservoir=[];for(const ar of exactUseful){const ipa=normalizeIPA(ar.ipa);if(!ipa||represented.has(ipa))continue;"
new2="const seriousReservoir=[];const reservoir=[];for(const ar of exactUseful){const ipa=normalizeIPA(ar.ipa);if(!ipa||seriousRepresented.has(ipa))continue;seriousReservoir.push(ar);if(alreadyIndexed.has(ipa))continue;"
if old2 not in s: raise SystemExit('reservoir loop not found')
s=s.replace(old2,new2,1)
old3="const preselected=imageable.slice(0,200);const shortStats={oneSyllable:unrepresented.filter(r=>r.syllableSpan===1).length,twoSyllable:unrepresented.filter(r=>r.syllableSpan===2).length,oneOrTwoSyllable:unrepresented.filter(r=>r.syllableSpan===1||r.syllableSpan===2).length,shortCombinable:unrepresented.filter(r=>r.unitCount<=5).length,imageableOneSyllable:imageable.filter(r=>r.syllableSpan===1).length,imageableTwoSyllable:imageable.filter(r=>r.syllableSpan===2).length,imageableShortCombinable:imageable.filter(r=>r.unitCount<=5).length};"
new3="const preselected=imageable.slice(0,200);const seriousRows=seriousReservoir.map(ar=>{const spans=(ar.syllableSpans||[]).map(Number).filter(Number.isFinite);return{ipa:normalizeIPA(ar.ipa),unitCount:splitIPAUnits(normalizeIPA(ar.ipa)).length,syllableSpan:spans.length?Math.min(...spans):null};});const shortStats={oneSyllable:seriousRows.filter(r=>r.syllableSpan===1).length,twoSyllable:seriousRows.filter(r=>r.syllableSpan===2).length,oneOrTwoSyllable:seriousRows.filter(r=>r.syllableSpan===1||r.syllableSpan===2).length,shortCombinable:seriousRows.filter(r=>r.unitCount<=5).length,imageableOneSyllable:imageable.filter(r=>r.syllableSpan===1).length,imageableTwoSyllable:imageable.filter(r=>r.syllableSpan===2).length,imageableShortCombinable:imageable.filter(r=>r.unitCount<=5).length};"
if old3 not in s: raise SystemExit('short stats declaration not found')
s=s.replace(old3,new3,1)
old4="unrepresentedUsefulExactSoundCount:unrepresented.length,imageableCandidateSoundCount:imageable.length"
new4="unrepresentedUsefulExactSoundCount:seriousRows.length,netNewCandidateSoundCount:unrepresented.length,imageableCandidateSoundCount:imageable.length"
s=s.replace(old4,new4,1)
old5="`- Réservoir utile exact non encore sérieusement représenté : ${unrepresented.length}.`,`- Sons avec au moins un candidat passant le filtre visuel explicite : ${imageable.length}.`"
new5="`- Réservoir utile exact non encore sérieusement représenté : ${seriousRows.length}.`,`- Sous-réservoir net-new (IPA absent des vagues 1–3) : ${unrepresented.length}.`,`- Sons net-new avec au moins un candidat passant le filtre visuel explicite : ${imageable.length}.`"
s=s.replace(old5,new5,1)
old6="unrepresentedUsefulExactSoundCount:unrepresented.length,imageableCandidateSoundCount:imageable.length,preselected:preselected.length"
new6="unrepresentedUsefulExactSoundCount:seriousRows.length,netNewCandidateSoundCount:unrepresented.length,imageableCandidateSoundCount:imageable.length,preselected:preselected.length"
s=s.replace(old6,new6,1)
p.write_text(s)
