# Configurateur repliable – Forster

Application web qui sort la **liste matière d'une porte repliable** : débit des profilés et des parcloses
(quantités, longueurs, coupes), nombre de barres, accessoires et remplissages.

> Calcul non contractuel : toutes les données sont à vérifier avant fabrication.

## Périmètre de la V1

| Saisie | Disponible | À venir |
|---|---|---|
| Gamme | Presto | Unico |
| Sens d'ouverture | Extérieur, intérieur | – |
| Vantaux | Repliés à gauche / à droite (2 à 9 au total) | – |
| Dimensions | Largeur et hauteur de baie | Limites mini / maxi |
| Profils | Tout en corps de 50 | Corps de 20, corps de 20 avec profil serrure en 50 |
| Remplissage | Verre 9 mm, verre 24 mm | Autres épaisseurs |
| Traverses | – | Quantité et épaisseur (50 / 20 / 10) |
| Quincaillerie | – | FMF 100, FMF 150, Mantion |

Aucun prix n'est stocké dans le dépôt (dépôt public).

## Utilisation

- En ligne : `https://lemoa869121.github.io/Config-repliable/` (après activation de GitHub Pages).
- En local :

```bash
git clone https://github.com/Lemoa869121/Config-repliable.git
cd Config-repliable
python3 -m http.server
# puis ouvrir http://localhost:8000
```

Un double-clic sur `index.html` ne fonctionne pas : le navigateur bloque la lecture de `data/presto.json`.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | Application |
| `css/style.css` | Charte graphique Forster (Faktum, couleurs, logo) |
| `js/calcul.js` | Moteur de calcul (fonctions pures, aussi utilisable sous Node) |
| `js/app.js` | Formulaire, schéma, tableaux, impression, copie, export CSV |
| `data/presto.json` | Articles, cotes de déduction, règles Presto |
| `tests/cas-pdf.json` | Positions de la liste de débit Forster utilisées comme référence |
| `tests/verifier.js` | Comparaison calcul / référence |
| `tests/tests.html`, `tests/run-node.js` | Lancement des tests (navigateur / ligne de commande) |
| `CAHIER_DES_CHARGES.md` | Règles métier (fait foi) |

**Principe :** les articles et les cotes vivent dans `data/`, la logique dans `js/`.

## Tests

```bash
node tests/run-node.js
```

ou ouvrir `tests/tests.html` via le serveur local. Les 21 positions de la liste de débit
« PRESTO repliables » sont recalculées et comparées (débits, T / Z, Din, verres, joints, boutons).
