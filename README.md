# Bikrito-BD

**Expose Sexual Violence in Bangladesh | Public Archive & Awareness Platform**

Bikrito-BD is a community-driven public archive documenting sexual violence and rape incidents in Bangladesh.
Users can view authentic news, verify facts through community voting, submit detailed case updates, and track justice outcomes in real time.

---

## Live Demo

> Deploy to [GitHub Pages](https://pages.github.com/) — see **Deployment** section below.

---

## Features

- 📰 **News Archive** — Cards with title, source link, vote counts, and colour-coded verification status
- 🗳️ **Community Voting** — True / Partial / False votes; one vote per user per entry; real-time updates
- 📋 **Case Updates** — Arrest status, number arrested, bail status, verdict, description — shown in a chronological timeline
- 📊 **Analytics Dashboard** — Total cases, verified cases, arrests, convictions + pie/bar charts
- 🔥 **Trending Strip** — Top-voted news highlighted
- 🔍 **Search, Filter, Sort** — By title, verification status, arrest status, date, vote count
- 🌙 **Dark / Light Mode** — Toggle with persistent preference
- 📱 **Fully Responsive** — Mobile-first design
- 🔗 **Social Sharing** — Facebook, Twitter, WhatsApp share buttons per card
- 🔐 **Google Authentication** — Only signed-in users can vote or submit updates

---

## Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | HTML5, CSS3, Vanilla JavaScript     |
| Backend     | Firebase Firestore (real-time)      |
| Auth        | Firebase Authentication (Google)    |
| Charts      | Chart.js                            |
| Icons       | Font Awesome 6                      |
| Hosting     | GitHub Pages                        |

---

## Project Structure

```
Bikrito-BD/
├── index.html              # Main HTML page
├── style.css               # Global CSS (responsive, dark/light mode)
├── app.js                  # Main JS: auth, voting, modals, search/filter/sort
├── firebase.js             # Firebase config & initialization
├── .gitignore
├── README.md
├── assets/                 # Images, logos, icons (add your own)
└── components/
    ├── newsCard.js         # News card renderer
    ├── timeline.js         # Case-update timeline renderer
    └── chart.js            # Analytics charts (Chart.js wrapper)
```

---

## Setup Instructions

### 1. Fork / Clone this repository

```bash
git clone https://github.com/Atikulislamx/Bikrito-BD.git
cd Bikrito-BD
```

### 2. Create a Firebase project

1. Go to https://console.firebase.google.com/
2. Click **Add project** and follow the wizard.
3. In **Project settings → Your apps**, add a **Web app** (`</>`).
4. Copy the `firebaseConfig` object shown.

### 3. Configure `firebase.js`

Open `firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### 4. Enable Firestore

- Firebase Console → **Firestore Database** → **Create database** (start in **production mode**).

### 5. Enable Google Authentication

- Firebase Console → **Authentication** → **Sign-in method** → Enable **Google**.

### 6. Set Firestore Security Rules

Go to **Firestore → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /news/{docId} {
      // Anyone can read
      allow read: if true;

      // Only authenticated users can create news entries
      allow create: if request.auth != null
                    && request.resource.data.keys().hasAll(['title','link','votes','voters','case_updates','timestamp'])
                    && request.resource.data.title is string
                    && request.resource.data.link  is string;

      // Only authenticated users can update votes or case_updates
      allow update: if request.auth != null
                    && (
                      // Voting update: only changing voters map and votes count
                      (request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['voters','votes']))
                      ||
                      // Case update: only changing case_updates array
                      (request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['case_updates']))
                    );

      allow delete: if false;
    }
  }
}
```

### 7. Deploy to GitHub Pages

1. Push your code to the `main` branch (or any branch).
2. Go to **Settings → Pages**.
3. Set **Source** to your branch, root `/`.
4. Visit the generated URL — done!

---

## Firestore Data Model

### Collection: `news`

| Field          | Type      | Description                                      |
|----------------|-----------|--------------------------------------------------|
| `title`        | string    | News headline                                    |
| `link`         | string    | Source URL                                       |
| `votes`        | number    | Total vote count                                 |
| `voters`       | map       | `{ uid: "true" | "false" | "partial" }`          |
| `case_updates` | array     | Array of case update objects (below)             |
| `submitted_by` | string    | UID of submitting user                           |
| `timestamp`    | timestamp | Server timestamp                                 |

### Case Update Object

| Field               | Type      | Values                                    |
|---------------------|-----------|-------------------------------------------|
| `user`              | string    | UID of submitting user                    |
| `user_name`         | string    | Display name                              |
| `arrested`          | string    | `yes` / `partial` / `no` / `unknown`      |
| `num_arrested`      | number    | Number of people arrested                 |
| `bail_status`       | string    | `yes` / `partial` / `no` / `unknown`      |
| `verdict`           | string    | `pending` / `convicted` / `acquitted`     |
| `case_description`  | string    | Free-text description                     |
| `timestamp`         | timestamp | Server timestamp                          |

---

## Verification Badges

| Status                | Condition    | Colour |
|-----------------------|--------------|--------|
| Verified              | votes >= 10  | Green  |
| Partially Verified    | votes >= 3   | Yellow |
| Unverified            | votes < 3    | Red    |

---

## How to Contribute

1. Add news entries with title and source link.
2. Vote **True / Partial / False** to verify authenticity.
3. Submit **case updates** with arrest, bail, and verdict information.
4. Report false or misleading information via GitHub Issues.

> Together, we can raise awareness and demand justice for victims in Bangladesh.

---

## License

MIT — see [LICENSE](LICENSE).
