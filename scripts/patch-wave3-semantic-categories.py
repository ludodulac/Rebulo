from pathlib import Path

path = Path('scripts/build-rebus-productive-bank-wave3.mjs')
source = path.read_text()
start = source.index('function semanticCategory(')
end = source.index('function detailedBrief', start)
replacement = r'''function semanticCategory(word,pos,concept=''){
 const w=String(word||'').toLocaleLowerCase('fr');
 const animals=new Set(['chien','chat','oiseau','poisson','loup','lion','ours','vache','cheval','mouche','poule','coq','canard','âne','lapin','rat']);
 const body=new Set(['main','bras','pied','tête','oeil','œil','yeux','nez','dent','bouche','dos','cou','jambe','visage']);
 const foods=new Set(['pain','lait','riz','thé','café','pomme','poire','fruit','gâteau','soupe','fromage','beurre','sel','sucre','jus','blé','dîner']);
 const places=new Set(['route','rue','gare','port','mer','parc','pré','ville','maison','école','jardin','champ','plage']);
 const people=new Set(['père','mère','fils','fille','bébé','roi','reine','homme','femme','enfant','mec','acteur','garde','nain']);
 const actions=new Set(['jouer','sortir']);
 if(animals.has(w))return'animal';
 if(body.has(w))return'body_part';
 if(foods.has(w))return'food';
 if(places.has(w))return'place_or_landscape';
 if(people.has(w))return'person';
 if(actions.has(w)||String(pos||'').toUpperCase().startsWith('VER'))return'drawable_action';
 return'concrete_object_or_scene';
}
'''
path.write_text(source[:start] + replacement + source[end:])
