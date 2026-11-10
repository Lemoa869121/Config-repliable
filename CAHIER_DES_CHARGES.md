# Cahier des charges – Configurateur repliable

*Référence fonctionnelle. Version 1 du 10/11/2026. Ce document fait foi en cas de doute sur une règle.*

## 1. Objectif

Sortir la liste matière d'une porte repliable Forster : articles, quantités, longueurs de débit, coupes,
nombre de barres, accessoires et remplissages.

## 2. Sources

- Liste de débit Forster « PRESTO repliables » (objet KDI-PRR), version corrigée du 10/11/2026.
- Règles données par Xavier Guiraud le 10/11/2026.

## 3. Saisies

Gamme · sens d'ouverture (extérieur / intérieur) · vantaux repliés à gauche / à droite · largeur et hauteur
de baie · épaisseur des profils · remplissage · traverses · quincaillerie.
V1 : voir le tableau du README (options non documentées affichées « à venir »).

## 4. Règles générales

1. Seuls comptent les repères présents dans la liste matière ; un numéro du schéma absent de la liste est ignoré.
2. Le plat de soudage 917017 est ignoré.
3. Barres : longueur utile **5900 mm**. Une pièce plus longue est coupée en morceaux.
4. Pas de serrure pour le moment.
5. À chaque jonction entre deux vantaux : **jamais un T face à un T, jamais un Z face à un Z**.
6. Pièces intercalaires : **2 × 916320 + 2 × 916322 par vantail**, quel que soit le Din
   (les 985631 / 985632 sont remplacées par les 916320 / 916322).

## 5. Formules Presto corps 50

L = largeur baie, H = hauteur baie, n = nombre de vantaux.

| Élément | Article | Pièces | Longueur | Coupe |
|---|---|---|---|---|
| Dormant haut | 32800 | 1 (coupé si > 5900) | L | 45° / 45° |
| Dormant gauche et droit | 32800 | 2 | H | 45° haut / 90° bas |
| Largeur ouvrant Lv | – | – | (L − 110) / n + 30 | – |
| Hauteur ouvrant Hv | – | – | H − 50 | – |
| Axes (cotes du schéma) | – | – | extrêmes Lv + 25, courants Lv − 30 | – |
| Traverse haute | 32803 T (ext.) / 32805 Z (int.) | 1 / vantail | Lv | 45° / 45° |
| Montants | 32803 T ou 32805 Z | 2 / vantail | Hv | 45° haut / 90° bas |
| Traverse basse | 32855 | 1 / vantail | Lv − 140 | 90° / 90° |
| Parclose horizontale | 901246 (verre 9) / 901226 (verre 24) | 2 / vantail | Lv − 140 | droite |
| Parclose verticale | idem | 2 / vantail | Hv − 180 | droite |
| Verre | – | 1 / vantail | (Lv − 156) × (Hv − 156) | – |
| Joint vitrage ext. / int. | 905312 / 905316 | – | n × 2 × ((Lv − 140) + (Hv − 140)) | – |
| Joint de battue | 905306 | – | n × (2 Lv + 4 Hv − 80) — **à confirmer** (vérifié à H = 2165 seulement) | – |
| Bouton de parclose | 906579 | arrondi(ml de parclose ÷ 0,20) | – | – |

Arrondis : Lv au dixième ; verres au millimètre.

## 6. Répartition des vantaux

k = vantaux repliés à gauche, m = à droite. « 3 » seul = 3 à gauche, 0 à droite.

**Din (extérieur)** : groupe gauche depuis le mur L, R, L… ; groupe droit depuis le mur R, L, R… Intérieur : inverse.

**T / Z** – règle générale : jamais T face à T ni Z face à Z. L'intérieur n'est **pas** le simple inverse de
l'extérieur (confirmé par Forster le 10/11/2026 : A 3+2 = TT ZZ TT ZT ZT, I 3+2 = ZZ TT ZZ TT ZZ).

*Extérieur* (par jonctions ; « T|Z » = montant droit du vantail de gauche en T, montant gauche du suivant en Z) :
- montants contre le dormant : T ;
- groupe gauche depuis le mur : T|Z, Z|T, T|Z… ;
- 1 vantail à droite : rencontre Z|T ; 2 vantaux ou plus : rencontre T|Z, puis T|Z, Z|T… depuis la rencontre ;
- tout à droite : miroir de « tout à gauche ».
Ex. 3+1 = TT ZZ TZ TT · 3+2 = TT ZZ TT ZT ZT · 3+3 = TT ZZ TT ZT ZZ TT.

*Intérieur* (par groupes) :
- chaque groupe alterne ZZ, TT, ZZ… en partant de son mur (montants contre le dormant en Z) ; traverse haute en Z ;
- en cas de conflit à la rencontre, un seul vantail mixte (dernier du groupe gauche si un seul vantail à droite,
  sinon premier du groupe droit).
Ex. 3+2 = ZZ TT ZZ TT ZZ · 3+1 = ZZ TT ZT ZZ (à confirmer) · 3+3 = ZZ TT ZZ TZ TT ZZ (à confirmer).

Répartitions vérifiées sur un exemple Forster : extérieur 2+1, 3, 3+1, 3+2, 3+3, 4+1, 5, 5+1, 6+1, 7, 7+1 ; intérieur 2+1, 3, 3+2, 4+1, 5.
Les autres affichent une alerte « non vérifiée ».

## 7. Coupe du dormant haut

Si L > 5900 : coupe sur un axe de vantail, nombre minimal de morceaux, morceaux les plus équilibrés possible.
Coupe droite à la jonction, 45° aux angles.

## 8. Export Excel (fichier d'import)

Bouton « Excel Forster Pro », fichier `export_excel_FP_<chantier>_<sens>_<k>+<m>_<L>x<H>.xlsx`. Format du fichier « export_excel_FP.xlsx » / « 2020 - Import - EN - Zusatzartikel.xlsx » fourni par Forster (feuille Tabelle1, listes de choix
de la feuille Tabelle2 conservées). Une ligne par pièce identique (article, longueur, coupes, emplacement).

| Colonne | Profilés et parcloses | Joints (au mètre) | Accessoires à la pièce |
|---|---|---|---|
| Article Number | référence | référence | référence |
| Lenght [mm] | longueur de débit | longueur totale en mm | 0 |
| Quantity | nombre de pièces | 1 | nombre de pièces |
| Formula | Fixed Length | Fixed Length | Fixed Length |
| Location | Top (dormant haut), Left (dormant gauche), Right (dormant droit), Free (le reste) | Free | Free |
| Primary Angles 1 / 2 | angle de coupe à chaque bout (45 ou 90) | vide | vide |
| Secondary Angles 1 / 2 | 90 / 90 | vide | vide |
| Per Meter, Extension, Colour, Price, Formula 2, Length 2, Assembly Name | vides | vides | vides |

Les remplissages (pas de référence article) ne sont pas exportés.

## 9. Écarts connus avec la liste de débit de référence

- A 3+2 : Din du PDF L R L R R, calculé L R L L R (T/Z conformes).
- A 8+1 (Din, T/Z), I 6+1 (Din) : non conformes aux règles retenues.
- I 3+1, I 3+3, I 5+1, I 6+1 : T face à T ou Z face à Z dans le PDF → erreurs du PDF.
- Dormant haut > 5900 : coupé par le configurateur (le PDF ne coupe pas toujours).

## 10. Questions ouvertes

T/Z intérieur pour un nombre pair de vantaux (3+1, 3+3, 5+1) · Din de A 3+2 · joint de battue à une autre hauteur · limites dimensionnelles ·
bas de porte · corps 20 et mixte · autres remplissages · traverses · FMF 100 / 150 · Unico.
