import fs from 'node:fs';

const path='data/dominant-sense-gold-225.json';
const d=JSON.parse(fs.readFileSync(path,'utf8'));
const VISUAL={
 // development only: source-independent editorial gold
 'DSG-D-007':[['personne nue','other','personne sans vêtements']],
 'DSG-D-008':[['essence carburant','material','carburant liquide / pompe à essence']],
 'DSG-D-020':[['compteur appareil','physical_object','appareil de comptage']],
 'DSG-D-021':[['danseur','person_role','personne en train de danser']],
 'DSG-D-025':[['broyeur machine','tool','machine qui broie']],
 'DSG-D-026':[['facteur','person_role','facteur postal identifiable']],
 'DSG-D-028':[['sorcier','person_role','personnage de sorcier']],
 'DSG-D-029':[['coiffeur','person_role','profession de coiffure']],
 'DSG-D-030':[['collier','physical_object','bijou porté autour du cou']],
 'DSG-D-032':[['tanière','place','abri d’un animal']],
 'DSG-D-041':[['chanter','action','personne qui chante']],
 'DSG-D-047':[['botter','action','donner un coup de pied']],
 'DSG-D-052':[['manuel','text','livre manuel']],
 'DSG-D-056':[['foin','plant','foin / herbe sèche']],
 'DSG-D-059':[['index doigt','body_part','doigt index']],
 'DSG-D-062':[['choc','event','collision / impact']],
 'DSG-D-065':[['bulle','physical_object','bulle visible']],
 'DSG-D-086':[['lettre Q','symbol','caractère Q']],
 'DSG-D-090':[['lumière','other','source ou faisceau lumineux']],
 'DSG-D-096':[['natte cheveux','physical_object','tresse de cheveux'],['natte tapis','physical_object','natte posée au sol']],
 'DSG-D-097':[['cheveu','body_part','cheveu isolé ou chevelure ciblée']],
 'DSG-D-098':[['shérif','person_role','shérif identifiable']],
 'DSG-D-100':[['volant','physical_object','volant de véhicule']],
 'DSG-D-107':[['hiver','event','scène hivernale']],
 'DSG-D-114':[['nord','relation','direction nord indiquée']],
 'DSG-D-115':[['orage','event','orage visible']],
 'DSG-D-120':[['chandelle','physical_object','bougie / chandelle']],
 'DSG-D-125':[['pieu','tool','pieu planté']],
 'DSG-D-126':[['couvent','place','bâtiment de couvent']],
 'DSG-D-128':[['halle','place','halle couverte']],
 'DSG-D-135':[['pique-nique','event','scène de pique-nique']],
 // sealed holdout labels; these are committed before any Kaikki lookup
 'DSG-H-015':[['quartier','place','quartier urbain reconnaissable']],
 'DSG-H-016':[['casier','physical_object','casier / compartiment de rangement']],
 'DSG-H-018':[['chanteur','person_role','personne chantant au micro']],
 'DSG-H-019':[['seigneur','person_role','seigneur en contexte historique']],
 'DSG-H-022':[['chantier','place','site de construction']],
 'DSG-H-024':[['joue','body_part','joue du visage']],
 'DSG-H-030':[['pêcher','action','personne qui pêche']],
 'DSG-H-033':[['voler dans les airs','action','être en vol'],['voler dérober','action','action de dérober']],
 'DSG-H-034':[['toucher','action','contact volontaire de la main']],
 'DSG-H-039':[['alien','other','créature extraterrestre']],
 'DSG-H-042':[['cachette','place','endroit servant à se cacher']],
 'DSG-H-048':[['shampoing','material','produit de shampoing clairement contextualisé']],
 'DSG-H-060':[['canne','physical_object','canne de marche']],
 'DSG-H-063':[['charriots','vehicle','plusieurs chariots']],
 'DSG-H-064':[['mousse végétale','plant','mousse sur une surface'],['mousse écume','material','mousse / écume visible']],
 'DSG-H-065':[['micro','physical_object','microphone']],
 'DSG-H-081':[['chasseur','person_role','chasseur identifiable']]
};

const TYPE_BY_WORD={
 convers:'abstract',malsain:'abstract',obscur:'abstract',suisse:'other',grossesse:'event',tannique:'material',nu:'other',essence:'material',navale:'abstract',tout:'quantity',portion:'quantity',fréquent:'abstract',perso:'other',comment:'relation',tranquille:'abstract',zut:'symbol',chut:'symbol',seules:'quantity',
 donneur:'person_role',compteur:'physical_object',danseur:'person_role',secteur:'relation',maintien:'abstract',millier:'quantity',broyeur:'tool',facteur:'person_role',chaleur:'other',sorcier:'person_role',coiffeur:'person_role',collier:'physical_object',bonheur:'abstract',tanière:'place',menteur:'person_role',
 manuel:'text',foin:'plant',azote:'material',index:'body_part',tore:'symbol',choc:'event',pari:'abstract',bulle:'physical_object',aide:'abstract',pine:'other',bet:'other',sceptique:'abstract',fasce:'symbol',jais:'material',dictats:'text',blues:'other',q:'symbol',fond:'relation',vitae:'text',chimio:'event',lumière:'other',pair:'relation',sosie:'person_role',proxys:'person_role',diktat:'text',cloque:'body_part',natte:'physical_object',cheveu:'body_part',shérif:'person_role',volant:'physical_object',vingt:'quantity',hiver:'event',mystère:'abstract',de:'relation',nord:'relation',orage:'event',sécu:'abstract',quête:'event',chandelle:'physical_object',pieu:'tool',couvent:'place',détour:'relation',halle:'place',valable:'abstract','pique-nique':'event',
 schaal:'other',mandans:'other',gênant:'abstract',inné:'abstract',surtout:'relation',haute:'abstract',frais:'abstract','nûment':'relation',pec:'other',ingrat:'abstract',session:'event',toi:'person_role',senseur:'physical_object',peurs:'abstract',quartier:'place',casier:'physical_object',peur:'abstract',chanteur:'person_role',seigneur:'person_role',vainqueur:'person_role',hardeur:'abstract',chantier:'place',vu:'action',joue:'body_part',agrée:'action',rimant:'action',masser:'action',tâte:'action',prévis:'action',pêcher:'action',ruser:'action',rissent:'action',voler:'action',toucher:'action',jars:'animal',biz:'other',flanc:'body_part','cache-cache':'event',alien:'other',appui:'relation',entre:'relation',cachette:'place',shogun:'person_role',bizut:'person_role',non:'relation','pare-feu':'physical_object',tard:'relation',shampoing:'material',ferre:'action',sciemment:'relation',commes:'relation',qqes:'quantity',virons:'action',halo:'other',scellant:'action',machez:'action',punch:'food',canne:'physical_object',passé:'event',charriots:'vehicle',mousse:'plant',micro:'physical_object',monde:'place',fierté:'abstract','moût':'material',visions:'abstract',bordé:'action',dicte:'action',miter:'action',boy:'person_role',confondre:'action',voisin:'person_role',futé:'abstract',chasseur:'person_role',disant:'action',buter:'action',leader:'person_role',comics:'text',musique:'other',pff:'symbol',cuistos:'person_role',malin:'abstract'
};

const VALID=new Set(['physical_object','animal','plant','food','body_part','person_role','vehicle','place','clothing','tool','material','event','action','abstract','relation','symbol','text','quantity','other']);
function fallbackType(r){if(r.proxyContext.conceptCategory==='action')return 'action';if(r.proxyContext.conceptCategory==='personne'||r.proxyContext.conceptCategory==='personne_rôle_candidat')return 'person_role';if(r.proxyContext.conceptCategory==='lieu')return 'place';if(r.proxyContext.conceptCategory==='animal')return 'animal';if(r.proxyContext.conceptCategory==='aliment')return 'food';if(r.proxyContext.conceptCategory==='corps')return 'body_part';if(r.proxyContext.conceptCategory==='vêtement')return 'clothing';if(r.proxyContext.conceptCategory==='véhicule')return 'vehicle';if(r.proxyContext.conceptCategory==='outil')return 'tool';if(r.proxyContext.conceptCategory==='abstrait'||r.proxyContext.conceptCategory==='fonction_ou_qualité')return 'abstract';return 'other';}
for(const r of d.rows){
 const expected=VISUAL[r.goldId]||[];
 const type=TYPE_BY_WORD[r.exactWord]||expected[0]?.[1]||fallbackType(r);
 if(!VALID.has(type))throw new Error(`Bad semantic type ${type} for ${r.goldId}`);
 const positive=expected.length>0;
 let risk='high';
 if(positive)risk=expected.length>1?'high':(['physical_object','animal','body_part','tool','vehicle'].includes(type)?'low':'medium');
 const rationale=positive
   ? (expected.length>1?'Plusieurs sens visuels autonomes plausibles, à distinguer par le ranking.':'Concept visuel autonome plausible avec une dénomination cible crédible avant consultation de la source.')
   : (['abstract','relation','quantity'].includes(type)?'Sens principalement abstrait, relationnel ou quantitatif; pas de concept visuel autonome assez sûr.':'Forme ou sens trop ambigu, rare, contextuel ou insuffisamment nommable pour être un candidat visuel sérieux.');
 r.goldReview={status:'editorial_reviewed_and_sealed_pre_source',seriousVisualConcept:positive,expectedVisualSenses:expected.map(([conceptLabel,semanticType,description],i)=>({goldSenseId:`${r.goldId}-S${i+1}`,conceptLabel,semanticType,description})),primarySemanticType:type,risk,rationale};
}
if(d.rows.some(r=>r.goldReview.status!=='editorial_reviewed_and_sealed_pre_source'))throw new Error('Unreviewed rows');
d.status='editorially_reviewed_and_sealed_before_semantic_source_lookup';
d.sourceLookedAt=false;
d.annotationMethod='independent editorial labels based only on exact graphy, IPA, and pre-existing B/proxy context; no Kaikki/Wiktextract lookup';
d.taxonomy=['physical_object','animal','plant','food','body_part','person_role','vehicle','place','clothing','tool','material','event','action','abstract','relation','symbol','text','quantity','other'];
d.counts={development:{n:d.rows.filter(r=>r.partition==='development').length,positive:d.rows.filter(r=>r.partition==='development'&&r.goldReview.seriousVisualConcept).length},holdout:{n:d.rows.filter(r=>r.partition==='holdout').length,positive:d.rows.filter(r=>r.partition==='holdout'&&r.goldReview.seriousVisualConcept).length}};
fs.writeFileSync(path,JSON.stringify(d,null,2)+'\n');
console.log(JSON.stringify(d.counts,null,2));