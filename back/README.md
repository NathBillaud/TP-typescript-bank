# API bancaire (TP TypeScript)

API qui gère des **utilisateurs** et leurs **comptes bancaires** (données fictives uniquement).

## Stack

- **Back-end** : Express 5 + TypeScript en mode `strict`. Choix : c'est la référence du cours, simple à lire.
- **Base de données** : MongoDB + Mongoose. Choix : vu en cours, Mongoose permet de définir des schémas et des règles de validation.
- **Front web** : Angular (dossier `front/`, TypeScript en mode `strict`).

## Choix techniques

- **Identifiant (`_id`)** : généré par MongoDB. Il est stocké comme un ObjectId et renvoyé en chaîne de caractères dans le JSON.
- **`balanceCents`** : entier en centimes (`10000` = 100,00 €). Choix : éviter les erreurs d'arrondi des nombres décimaux. Le sujet parle de « décimal », mais la règle 3 demande un entier positif ou nul.
- **`userId` d'un compte** : ObjectId avec `ref: "User"`, pour relier le compte à son utilisateur. L'API l'échange en chaîne.
- **E-mail et IBAN uniques** : index MongoDB. Un doublon renvoie **409**.
- **`typecheck`** : vérifie les types sans générer de fichiers (`tsc --noEmit`). Node exécute directement les fichiers `.ts`.

## Lancer le projet

1. Démarrer MongoDB sur `localhost:27017` (service Windows). La base utilisée est `Bank` (avec un B majuscule, voir [config.ts](d:/workspace/typescript/TP/back/src/config.ts)) : MongoDB distingue les majuscules des minuscules.
2. Dans le dossier `back/` :

```powershell
npm install
npm run dev
```

3. Vérifier que l'API répond :

```powershell
curl.exe http://localhost:3000/api/health
```

Autres scripts : `npm run typecheck`.

Pour le front, dans un second terminal, dans le dossier `front/` :

```powershell
npm install
npm start
```

Le front est ensuite disponible sur `http://localhost:4200` (le back doit tourner sur le port 3000).

## Routes

| Méthode | URL | Rôle | Succès |
|---|---|---|---|
| GET | `/api/health` | Vérifier que l'API répond | 200 |
| GET | `/api/users` | Lister les utilisateurs | 200 |
| GET | `/api/users/:id` | Lire un utilisateur | 200 |
| POST | `/api/users` | Créer un utilisateur | 201 |
| PATCH | `/api/users/:id` | Modifier un utilisateur | 200 |
| DELETE | `/api/users/:id` | Supprimer (409 s'il a des comptes) | 204 |
| GET | `/api/users/:id/accounts` | Lister les comptes d'un utilisateur | 200 |
| GET | `/api/accounts` | Lister les comptes (filtres `userId`, `type`) | 200 |
| GET | `/api/accounts/:id` | Lire un compte | 200 |
| POST | `/api/accounts` | Créer un compte | 201 |
| PATCH | `/api/accounts/:id` | Modifier `label` ou `type` | 200 |
| DELETE | `/api/accounts/:id` | Supprimer (409 si solde ≠ 0) | 204 |

## Erreurs

Toutes les erreurs répondent en JSON, par exemple `{ "message": "User not found" }`.

| Code | Quand |
|---|---|
| 400 | id mal formé, JSON cassé, données invalides |
| 404 | ressource inexistante ou route inconnue |
| 409 | doublon (e-mail) ou suppression refusée |
| 500 | erreur inattendue (le détail est seulement dans la console) |

## Avancement

- [x] Modèles `User` et `BankAccount`
- [x] Routes utilisateurs
- [x] Erreurs en JSON
- [x] Routes comptes
- [x] Recette Postman
- [x] Front Angular
