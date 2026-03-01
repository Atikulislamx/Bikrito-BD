# Bikrito-BD Copilot Instructions

Generate a full web application for **Bikrito-BD**, a public platform documenting sexual violence in Bangladesh.  

### Requirements:

**Frontend**
- HTML, CSS, JS (React optional)
- Responsive design (mobile-first)
- Dark mode + Light mode toggle
- Clean, professional card layout for news
- Expandable cards showing case updates in a timeline
- Search, filter, and sort news by title, votes, verification status, arrest status

**Backend / Firebase**
- Firebase Firestore database:
  - Collection: `news`
  - Document fields: `title`, `link`, `votes`, `case_updates`, `timestamp`
  - `case_updates` fields: `user`, `arrested`, `num_arrested`, `bail_status`, `case_description`, `verdict`, `timestamp`
- Firebase Authentication (Google Login)
  - Only logged-in users can vote and submit/edit updates
  - One account = one vote per news entry
- Security rules: prevent fake votes and unauthorized edits

**Voting & Fact-Checking**
- Users can vote True/False/Partial for each news
- Users can edit their own vote or update submission
- Verified votes give a verification badge to news entries

**Case Updates**
- Add/update arrest status, number arrested, bail, verdict
- Timeline view for case progress
- Editable by the user who submitted the update
- Color-coded updates for clarity

**Analytics / Visualization**
- Display total cases, verified cases, arrests, convictions
- Trending / Most Voted News section
- Optional charts: bar chart, pie chart

**Optional Features**
- Share buttons (Facebook, Twitter, WhatsApp)
- Search & filter functionality
- Smooth hover animations and transitions
- Minimal, professional CSS style

**Hosting**
- GitHub Pages for frontend
- Firebase for backend + real-time updates

Generate **all HTML, CSS, JS files**, Firebase integration code, and comments for clarity.

---

## **Project Folder Structure**

Bikrito-BD/
│
├── index.html          # Main HTML page
├── style.css           # Global CSS (responsive + dark/light mode)
├── app.js              # Main JS (fetch news, votes, Firebase logic)
├── firebase.js         # Firebase config & initialization
├── README.md           # Public + Copilot prompt info
├── assets/             # Images, icons, logos
└── components/         # Optional JS/HTML components (newsCard.js, timeline.js)
