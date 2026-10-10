# Galsen Brief — mode d'emploi de la production automatique

Ce dossier fabrique les vidéos (1080×1920, ~75 s, voix Vivienne, sous-titres synchronisés, vraies photos créditées)
et le carrousel hebdomadaire (1080×1350). Tout se pilote par un fichier JSON ; le montage est fixe (Remotion).

## 0. Installation (à chaque exécution, environ 2 min)

```bash
bash scripts/setup.sh
```

## 1. Fichier d'édition : `editions/<AAAA-MM-JJ>-<matin|midi|soir>.json`

```json
{
  "id": "2026-10-10-matin",
  "edition": "matin",
  "date": "Samedi 10 octobre 2026",
  "voice": "fr-FR-VivienneMultilingualNeural",
  "rate": "+6%",
  "intro": "Bonjour le Sénégal, c'est Galsen Brief. Voici ce qu'il faut savoir ce matin.",
  "outro": "C'était Galsen Brief. Rendez-vous ce midi pour la société et le sport. Abonne-toi pour ne rien rater.",
  "nextEdition": "RDV À MIDI",
  "segments": [
    {
      "rubrique": "actu",
      "titre": "137,5 mm : record de pluie depuis 1946",
      "chiffre": "137,5 mm",
      "voix": "Dimanche dernier, Yoff a reçu 137,5 millimètres de pluie en 24 heures…",
      "source": "Dakaractu · Senego",
      "imageUrl": "https://www.dakaractu.com/photo/art/grande/....jpg",
      "imageCredit": "Dakaractu",
      "cropLeft": 0.11
    }
  ]
}
```

Textes fixes par créneau :

| Créneau | intro | outro | nextEdition |
|---|---|---|---|
| matin | Bonjour le Sénégal, c'est Galsen Brief. Voici ce qu'il faut savoir ce matin. | C'était Galsen Brief. Rendez-vous ce midi pour la société et le sport. Abonne-toi pour ne rien rater. | RDV À MIDI |
| midi | Salut le Sénégal, c'est Galsen Brief, l'édition de midi. | C'était Galsen Brief. Ce soir : le showbiz et ce qui a buzzé. Abonne-toi pour ne rien rater. | CE SOIR : SHOWBIZ |
| soir | Bonsoir le Sénégal, c'est Galsen Brief, l'édition du soir : showbiz et ça a buzzé. | C'était Galsen Brief. On se retrouve demain matin. Abonne-toi pour ne rien rater. | RDV DEMAIN MATIN |

Règles d'écriture :
- 4 à 5 segments. « voix » : 2 à 3 phrases, 25 à 40 mots, ton direct. Total visé ~75 s.
- « titre » : 45 caractères max, sans point final. « chiffre » (facultatif) : 9 caractères max (« 137,5 mm », « 19 kg », « TAS », « 3 000 F »). Sans chiffre fort, on l'omet.
- « rubrique » : actu, faits-divers, justice, politique, societe, sport, showbiz, buzz.
- Les nombres s'écrivent en chiffres : la voix les lit en toutes lettres automatiquement.
- Sigles et noms propres : la prononciation est dans `pronunciation.json` (CAN → Cane, Thiès → Tièsse…).
  Pour un nouveau sigle ou nom mal lu, ajoute-le (clé = mot écrit, valeur = comment le lire) et signale-le à David.

## 2. Photos (vraies photos de l'actu, créditées)

- Prends l'image principale de l'article source : balise `<meta property="og:image">` de la page (via curl).
- « imageCredit » = le média qui publie la photo. Elle s'affiche à l'écran (« PHOTO : DAKARACTU »).
- Dakaractu incruste souvent un bandeau vertical (« SOCIÉTÉ ») à gauche : mets `"cropLeft": 0.11`.
  Une légende incrustée en bas : `"cropBottom": 0.15`. Regarde l'image avant de décider (outil Read sur le fichier).
- Interdits : visage d'un mineur ; victime, corps ou blessé ; suspect reconnaissable (dos ou flouté uniquement) ;
  particulier identifiable dans un fait divers. Dans ces cas : photo d'un lieu neutre (tribunal, commissariat, ville) ou pas de photo.
- Pas d'image générée par IA présentée comme réelle.

## 3. Charte (résumé — charte complète : https://claude.ai/code/artifact/c2a0cfb3-82ed-4a79-a4d7-d95a016cdab3)

- Une source écrite identifiable par info, deux pour un sujet grave. Chaque info cite sa source.
- Présomption d'innocence (« soupçonné », conditionnel) ; ne pas nommer un suspect qui n'est pas une personnalité publique.
- Ne pas nommer une victime sans accord de la famille ; aucun mineur identifiable.
- Pas de rumeurs ni de « révélations » de live non confirmées par la personne concernée ou un média.
- Rien de stigmatisant (ethnie, religion, confrérie, région, orientation sexuelle).
- Reformuler, ne jamais recopier un article.

## 4. Fabriquer la vidéo

```bash
python3 scripts/produce.py editions/<id>.json   # ~5 min : photos, voix, rendu
```
Sortie : `out/<id>.mp4` et `out/<id>.jpg` (miniature). Regarde la miniature et au moins un autre plan
(`npx remotion still src/index.ts GalsenBrief /tmp/x.png --props=public/editions/<id>/props.json --frame=N`)
pour vérifier qu'aucun texte ne déborde. Si un titre déborde, raccourcis-le et relance.

## 5. Carrousel hebdomadaire : `weekly/<AAAA-MM-JJ>.json`

Voir `weekly/2026-10-09.json` pour le format (6 items : rubrique, titre, chiffre, chiffreLabel, texte ~40 mots, source,
imageUrl/cropLeft, credit). Puis :
```bash
python3 scripts/produce_week.py weekly/<id>.json   # sortie : out/semaine-<id>/slide-1..N.png
```

## 6. Livraison (rien n'est publié sans la validation de David)

1. Envoie la vidéo (ou les slides) et la miniature à David avec SendUserFile.
2. Mets la vidéo en ligne sur Cloudinary : outil `sign-upload` avec
   `{"folder": "galsen-brief/editions", "public_id": "<id>"}`, puis
   `curl https://<host>/v1_1/<cloud_name>/video/upload -F 'file=@"out/<id>.mp4"' -F api_key=… -F signature=… -F <chaque clé de upload_params>`.
   Garde le `secure_url`. (Slides : `image/upload`, dossier `galsen-brief/semaine`.)
3. Metricool : `getBrandSettings`. S'il existe une marque dont le nom contient « galsen », crée la publication avec
   `createScheduledPostForReview` (reviewers : dvddiatta@gmail.com, approvalSystem « any ») sur les réseaux connectés,
   à l'heure prévue du créneau, avec la légende et le `secure_url`. Sinon, ne publie rien et dis-le simplement.
4. Message final à David : liste des sujets, sources, ce qui a été écarté par la charte, et le lien Metricool s'il existe.

Légende type : titre accrocheur + 3 lignes (un emoji par sujet) + « Sources : … » + #Senegal #Kebetu #GalsenBrief #ActuSenegal.
