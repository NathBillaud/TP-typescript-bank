# TP d'une journée - API bancaire (utilisateurs et comptes) en TypeScript

**Module** : TypeScript - M1 · Mastère Expert en développement et déploiement de solutions numériques sécurisées
**Compétence** : Bloc 4 - B4C6 - D44 TypeScript
**Durée** : 1 journée (≈ 7 h de travail effectif)
**Modalité** : individuel (binôme possible si validé par l'intervenant)
**Livrable** : alimente la qualité du code du dossier **MSPR 4.1**

---

## 1. Contexte et objectif

Pendant le cours, nous avons pris un Task Manager comme fil rouge : une API Express qui renvoie en JSON le résultat d'une requête Mongoose, puis un front Angular qui l'affiche.

Ce TP **change de sujet** mais reprend **la même démarche** :

> Une mini-application bancaire : des **utilisateurs** et leurs **comptes bancaires**.
> Un **CRUD** complet sur les deux ressources, de la base de données jusqu'à l'écran.

Ce que vous réutilisez du cours :

- une **interface** TypeScript, un **schéma** et un **modèle** pour décrire les données
- une route = attendre une requête, puis renvoyer son résultat en JSON
- **Postman d'abord**, le front ensuite
- CORS, et le fait que le typage s'arrête à la frontière HTTP

Ce qui est nouveau : deux ressources **liées** entre elles, des **règles métier**, et un nouveau code HTTP (**409**).

À la fin de la journée, vous devez être capable de démontrer que :

- l'API est **fonctionnelle**, **conforme aux règles métier** et **validée avec Postman** avant toute intégration front
- le code est **typé** (TypeScript strict) et lisible
- le front web consomme l'API et permet de gérer des utilisateurs et leurs comptes
- l'usage de TypeScript a **réduit les anomalies à l'exécution** et facilite la maintenance (à documenter, voir §9)

> **Données fictives uniquement.** N'utilisez aucun vrai IBAN, aucune vraie identité, aucune vraie adresse e-mail personnelle. Utilisez par exemple des adresses en `@example.com`.

---

## 2. Vos choix techniques

**Vous êtes libres de votre stack**, à condition de respecter les règles ci-dessous.

| Couche | Référence du cours | Alternatives acceptées |
|---|---|---|
| Back-end | **Express 5** + TypeScript | **NestJS** |
| Base de données | **MongoDB** + Mongoose | PostgreSQL, MySQL, SQLite… (avec Prisma, Drizzle, TypeORM, ou autre) |
| Front web | **Angular** | **React**, **Vue**, Svelte, ou autre framework web de votre choix |

### Règles

1. **TypeScript obligatoire** côté back-end **et** côté front web, en mode `strict`.
2. **Le contrat d'API est identique pour tout le monde**, quelle que soit la stack. C'est lui qui permet de tester votre travail avec Postman.
3. **Déclarez votre stack** en tête de votre `README.md`.
4. Si vous sortez de la référence du cours (par exemple React ou NestJS), vous êtes **autonomes** sur la documentation : le parcours guidé reste celui de la référence.
5. Chaque choix doit être **justifié en une phrase** dans le README.
6. Avec une base relationnelle, la relation utilisateur → comptes devient une **clé étrangère** : les règles métier du §4 restent les mêmes.

> **Attention NestJS** : Node exécute le TypeScript en retirant les types, mais il **ne supporte pas les décorateurs**. Un projet Nest se lance donc avec ses propres outils (`nest start`), pas avec `node src/main.ts`.

### Prérequis

- Node 26 et npm
- Postman
- Git et un compte GitHub
- Une base de données accessible (par exemple MongoDB avec `docker run -d --name mongo -p 27017:27017 mongo:8`)
- Un éditeur avec le support TypeScript
- *(bonus Flutter uniquement)* Flutter SDK et un émulateur ou un téléphone

---

## 3. Planning de la journée

Vous avez toute la journée pour faire le TP.

---

## 4. Cahier des charges : le contrat d'API

### 4.1 Modèles de données

#### Utilisateur (`User`)

| Champ | Type | Règles |
|---|---|---|
| identifiant | `string` | généré par la base (`_id` avec MongoDB : à documenter dans votre README) |
| `firstName` | `string` | obligatoire, non vide (après `trim`) |
| `lastName` | `string` | obligatoire, non vide (après `trim`) |
| `email` | `string` | obligatoire, format valide, **unique**, stocké en minuscules |
| `createdAt` / `updatedAt` | date ISO 8601 | gérés automatiquement |

#### Compte bancaire (`BankAccount`)

| Champ | Type                      | Règles                                                                            |
|---|---------------------------|-----------------------------------------------------------------------------------|
| identifiant | `string`                  | généré par la base                                                                |
| `userId` | `string`                  | obligatoire, doit désigner un **utilisateur existant** ; non modifiable           |
| `iban` | `string`                  | obligatoire, **unique**, format `^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$` ; non modifiable |
| `type` | `'checking' \| 'savings'` | obligatoire (compte courant ou épargne)                                           |
| `label` | `string`                  | optionnel (par exemple « Compte joint »)                                          |
| `balanceCents` | `???`                     | **décimal** ≥ 0, valeur par défaut 0 ; fixé à la création, non modifiable         |
| `createdAt` / `updatedAt` | date ISO 8601             | gérés automatiquement                                                             |

### 4.2 Règles métier

1. Un **e-mail** et un **IBAN** ne peuvent exister qu'une fois → **409** en cas de doublon.
2. On ne peut pas créer un compte pour un utilisateur qui n'existe pas → **400**.
3. `balanceCents` doit être un **entier positif ou nul** → **400** sinon.
4. Sur un compte, seuls `label` et `type` sont modifiables. Tout autre champ dans un `PATCH` (`balanceCents`, `iban`, `userId`…) → **400**.
5. On ne peut pas **supprimer un utilisateur** qui possède encore des comptes → **409**.
6. On ne peut pas **supprimer un compte** dont le solde n'est pas nul → **409**.

### 4.3 Routes

| Méthode | URL | Rôle | Succès |
|---|---|---|---|
| GET | `/api/health` | Vérifier que l'API répond | 200 |
| GET | `/api/users` | Lister les utilisateurs | 200 |
| GET | `/api/users/:id` | Lire un utilisateur | 200 |
| POST | `/api/users` | Créer un utilisateur | 201 |
| PATCH | `/api/users/:id` | Modifier partiellement | 200 |
| DELETE | `/api/users/:id` | Supprimer | 204 |
| GET | `/api/users/:id/accounts` | Lister les comptes d'un utilisateur | 200 |
| GET | `/api/accounts` | Lister les comptes (filtres `?userId=` et `?type=`) | 200 |
| GET | `/api/accounts/:id` | Lire un compte | 200 |
| POST | `/api/accounts` | Créer un compte | 201 |
| PATCH | `/api/accounts/:id` | Modifier `label` et/ou `type` | 200 |
| DELETE | `/api/accounts/:id` | Supprimer | 204 |

### 4.4 Format des erreurs

Toutes les erreurs renvoient du **JSON** (jamais une page HTML) :

```json
{ "message": "Email already used" }
```

| Code | Quand |
|---|---|
| 400 | corps invalide, champ invalide, champ non modifiable, identifiant mal formé, filtre inconnu, JSON cassé |
| 404 | ressource inexistante, route inconnue |
| 409 | conflit : doublon (e-mail, IBAN) ou suppression interdite par une règle métier |
| 500 | erreur inattendue (sans exposer le détail interne) |

### 4.5 Exemples

Création d'un utilisateur : `POST /api/users`

```json
{ "firstName": "Alice", "lastName": "Martin", "email": "alice.martin@example.com" }
```

Réponse `201 Created` :

```json
{
  "_id": "6650f1c2a1b2c3d4e5f60718",
  "firstName": "Alice",
  "lastName": "Martin",
  "email": "alice.martin@example.com",
  "createdAt": "2026-11-03T09:30:00.000Z",
  "updatedAt": "2026-11-03T09:30:00.000Z"
}
```

Création d'un compte : `POST /api/accounts`

```json
{
  "userId": "6650f1c2a1b2c3d4e5f60718",
  "iban": "FR7612345678901234567890123",
  "type": "checking",
  "label": "Main account",
  "balanceCents": 10000
}
```

Réponse `201 Created` : le compte, avec son identifiant et ses dates. Ici, `balanceCents: 10000` correspond à **100,00 €**.

---

## 5. Recette Postman (critères d'acceptation)

Votre API est considérée comme **conforme** quand toutes ces requêtes donnent le résultat attendu.

### 5.1 Général et utilisateurs

| # | Requête | Body JSON | Attendu |
|---|---|---|---|
| 1 | GET `/api/health` | — | 200 |
| 2 | GET `/api/users` | — | 200 + tableau |
| 3 | GET `/api/users/<id existant>` | — | 200 |
| 4 | GET `/api/users/abc` | — | 400 |
| 5 | GET `/api/users/<id valide mais absent>` | — | 404 |
| 6 | POST `/api/users` | `{ "firstName": "Alice", "lastName": "Martin", "email": "alice.martin@example.com" }` | 201 |
| 7 | POST `/api/users` | *(le même e-mail)* | 409 |
| 8 | POST `/api/users` | `{ "firstName": "", "lastName": "Martin", "email": "a@example.com" }` | 400 |
| 9 | POST `/api/users` | `{ "firstName": "Bob", "lastName": "Durand", "email": "not-an-email" }` | 400 |
| 10 | POST `/api/users` | `{bad json` | 400 |
| 11 | POST `/api/users` | *(aucun corps)* | 400 |
| 12 | PATCH `/api/users/<id>` | `{ "lastName": "Durand" }` | 200, nom modifié |
| 13 | PATCH `/api/users/<id>` | `{ "email": "not-an-email" }` | 400 |
| 14 | PATCH `/api/users/<id valide mais absent>` | `{ "lastName": "Durand" }` | 404 |
| 15 | DELETE `/api/users/<id d'un utilisateur sans compte>` | — | 204 |
| 16 | DELETE `/api/users/<le même id>` | — | 404 |
| 17 | DELETE `/api/users/<id d'un utilisateur avec comptes>` | — | **409** |
| 18 | GET `/api/inconnue` | — | 404 en JSON |

### 5.2 Comptes

| # | Requête | Body JSON | Attendu |
|---|---|---|---|
| 19 | POST `/api/accounts` | compte valide (voir §4.5) | 201 |
| 20 | POST `/api/accounts` | *(le même IBAN)* | 409 |
| 21 | POST `/api/accounts` | `userId` d'un utilisateur inexistant | 400 |
| 22 | POST `/api/accounts` | `"type": "nope"` | 400 |
| 23 | POST `/api/accounts` | `"balanceCents": 12.5` | 400 |
| 24 | POST `/api/accounts` | `"balanceCents": -100` | 400 |
| 25 | POST `/api/accounts` | `"iban": "abc"` | 400 |
| 26 | GET `/api/accounts` | — | 200 + tableau |
| 27 | GET `/api/accounts?type=savings` | — | 200, uniquement des comptes d'épargne |
| 28 | GET `/api/accounts?type=nope` | — | 400 |
| 29 | GET `/api/accounts?userId=<id>` | — | 200, comptes de cet utilisateur |
| 30 | GET `/api/users/<id>/accounts` | — | 200 ; **404** si l'utilisateur n'existe pas |
| 31 | GET `/api/accounts/<id existant>` | — | 200 |
| 32 | GET `/api/accounts/abc` | — | 400 |
| 33 | GET `/api/accounts/<id valide mais absent>` | — | 404 |
| 34 | PATCH `/api/accounts/<id>` | `{ "label": "Savings for holidays" }` | 200 |
| 35 | PATCH `/api/accounts/<id>` | `{ "balanceCents": 999999 }` | **400** (solde non modifiable) |
| 36 | PATCH `/api/accounts/<id>` | `{ "iban": "FR0000000000000000000000000" }` | 400 (IBAN non modifiable) |
| 37 | DELETE `/api/accounts/<id d'un compte au solde non nul>` | — | **409** |
| 38 | DELETE `/api/accounts/<id d'un compte au solde nul>` | — | 204, puis 404 au second appel |

**Livrable Postman** : la collection exportée (`postman/bank-api.postman_collection.json`), organisée en deux dossiers (« Users » et « Accounts »), avec une variable `baseUrl`.

---

## 6. Pour ceux qui ont fini (bonus)

Les bonus ne comptent **que si le socle (phases 0 à 6) est validé**. L'ordre ci-dessous est recommandé, mais libre.

### Bonus 1 - Authentification JWT (Bearer token)

**Objectif** : sécuriser l'API avec un jeton JWT envoyé dans l'en-tête `Authorization: Bearer <token>`. Pour une application bancaire, c'est indispensable : sans authentification, n'importe qui lit les comptes de n'importe qui.

**Évolution du modèle** : ajouter un mot de passe à l'utilisateur. Il est **haché** (bcrypt, argon2…), jamais stocké en clair, **jamais renvoyé par l'API**.

**Contrat à respecter**

| Méthode | URL | Rôle | Succès |
|---|---|---|---|
| POST | `/api/auth/register` | Créer un compte utilisateur (`firstName`, `lastName`, `email`, `password`) | 201 |
| POST | `/api/auth/login` | Se connecter (`email`, `password`), renvoie `{ "token": "..." }` | 200 |

À faire :

- [ ] Signer le JWT avec un secret lu dans une **variable d'environnement** (`JWT_SECRET`), avec une durée d'expiration
- [ ] Mauvais e-mail ou mauvais mot de passe : **401**, avec **le même message** dans les deux cas (ne pas révéler si l'e-mail existe)
- [ ] Écrire un middleware (ou *guard* Nest) qui lit `Authorization: Bearer <token>`, vérifie le jeton, et répond **401** s'il est absent, invalide ou expiré
- [ ] Protéger **toutes** les routes `/api/users` et `/api/accounts` (seuls `/api/health` et `/api/auth/*` restent publics)
- [ ] **Règle de propriété** : un utilisateur ne peut lire et modifier que **son propre profil** et **ses propres comptes**. Sinon **403**
- [ ] **Typer** l'utilisateur ajouté à la requête (augmentation de type de `Request`), sans `any`
- [ ] Postman : onglet *Authorization* → *Bearer Token* avec une variable `{{token}}` ; rejouer la recette avec et sans jeton
- [ ] Front : page de connexion, **intercepteur** HTTP qui ajoute l'en-tête, gestion du 401 (retour à la connexion)
- [ ] Question à traiter dans le README : où stocker le jeton côté navigateur, et quels sont les risques de chaque option ?

### Bonus 2 - Documentation Swagger / OpenAPI

**Objectif** : documenter l'API de façon interactive.

- [ ] Exposer l'interface Swagger UI sur `/api/docs` (par exemple `swagger-ui-express` avec Express, `@nestjs/swagger` avec Nest)
- [ ] Documenter **toutes** les routes : paramètres, filtres, corps de requête, codes de réponse (200, 201, 204, 400, 404, 409)
- [ ] Définir les **schémas** : `User`, `BankAccount`, les corps de création et de modification, `Error`
- [ ] Documenter les **règles métier** dans les descriptions (par exemple : « 409 si le solde n'est pas nul »)
- [ ] Si le bonus JWT est fait : déclarer le schéma de sécurité *Bearer* et le bouton **Authorize**
- [ ] Tester chaque route depuis l'interface (*Try it out*)
- [ ] Versionner le fichier `openapi.json` dans le dépôt et vérifier qu'il s'importe dans Postman

### Bonus 3 - Déploiement avec GitHub

**Objectif** : une application accessible en ligne, avec une intégration continue.

- [ ] Dépôt GitHub propre : `README`, `.gitignore`, `.env.example` (sans valeurs secrètes), historique de commits lisible
- [ ] Travailler par **branches** et *pull request* (même seul), au moins pour une fonctionnalité
- [ ] Workflow **GitHub Actions** (`.github/workflows/ci.yml`) déclenché sur `push` et `pull_request` : installation (`npm ci`), `typecheck`, build du front
- [ ] **Front** : déploiement automatique (par exemple GitHub Pages) ; pensez à l'URL de base de l'application
- [ ] **API** : déploiement sur un hébergeur de votre choix (par exemple Render, Railway, Fly.io : vérifier les offres gratuites en vigueur)
- [ ] **Base de données** hébergée (par exemple MongoDB Atlas pour Mongo, ou le service managé de votre SGBD)
- [ ] Variables d'environnement et **secrets** (`GitHub Secrets`, variables de l'hébergeur) : rien dans le code
- [ ] Mettre à jour **CORS** (origine de production) et l'URL de l'API côté front (configuration par environnement)
- [ ] Rejouer la collection Postman sur l'URL de production (variable `baseUrl`)
- [ ] Ajouter les URL publiques et un badge de statut du workflow dans le README

### Bonus 4 - Version mobile avec Flutter (second front)

**Objectif** : un **deuxième front**, mobile, qui consomme **la même API**. Vous aurez ainsi deux fronts (web et Flutter) pour un seul back-end : c'est la preuve qu'un contrat d'API bien défini est réutilisable.

- [ ] Créer le projet dans un dossier `mobile/`
- [ ] Écrire les classes `User` et `BankAccount` avec `fromJson` et `toJson` : en Dart aussi, on **type** ce qui vient du réseau
- [ ] Créer un service API (package `http` ou `dio`)
- [ ] Écran liste des utilisateurs, puis écran des comptes d'un utilisateur avec les soldes formatés en euros
- [ ] Gestion du chargement, de l'erreur, de la liste vide, et rafraîchissement par glissement
- [ ] Création d'un compte, suppression (par exemple par glissement) avec confirmation
- [ ] Afficher le message de l'API quand une suppression est refusée (409)
- [ ] Si le bonus JWT est fait : écran de connexion et envoi de l'en-tête `Authorization`, jeton conservé de façon sécurisée (par exemple `flutter_secure_storage`)

**Pièges réseau fréquents**

| Cible | Adresse de l'API |
|---|---|
| Émulateur Android | `http://10.0.2.2:3000` (et non `localhost`) |
| Simulateur iOS, application de bureau | `http://localhost:3000` |
| Téléphone réel | l'adresse IP de votre ordinateur sur le réseau local (même Wi-Fi, pare-feu autorisant le port) |

- Android bloque le HTTP non chiffré par défaut : en développement, il faut l'autoriser explicitement (ou utiliser HTTPS).
- **CORS ne concerne pas une application mobile native** : c'est une protection du navigateur.

### Extensions libres (si vous en voulez encore)

- Opérations **dépôt**, **retrait** et **virement** entre deux comptes, avec la règle « découvert interdit »
- Historique des **transactions** d'un compte
- Pagination et tri des listes

---

## Ressources

- Express : https://expressjs.com
- Mongoose : https://mongoosejs.com
- TypeScript : https://www.typescriptlang.org/docs
- Angular : https://angular.dev
- NestJS : https://docs.nestjs.com
- Swagger / OpenAPI : https://swagger.io/docs
- JWT : https://jwt.io
- GitHub Actions : https://docs.github.com/actions
- Flutter : https://docs.flutter.dev
- Les slides de l'après-midi : le parcours de référence (Express + Mongoose + Angular)
