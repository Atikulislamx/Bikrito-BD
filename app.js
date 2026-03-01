/**
 * app.js — Bikrito-BD Main Application Script
 *
 * Responsibilities:
 *  - Firebase Auth (Google Sign-In / Sign-Out)
 *  - Firestore real-time news listener
 *  - Rendering news cards with voting, case updates, search/filter/sort
 *  - Modal management (add news, add/edit case updates)
 *  - Analytics summary & charts
 *  - Dark/Light mode toggle
 *  - Toast notifications
 */

'use strict';

/* ============================================================
   1. DOM References
   ============================================================ */
const themeToggle       = document.getElementById('themeToggle');
const themeIcon         = document.getElementById('themeIcon');
const authBtn           = document.getElementById('authBtn');
const userInfoEl        = document.getElementById('userInfo');
const userAvatar        = document.getElementById('userAvatar');
const userNameEl        = document.getElementById('userName');
const signOutBtn        = document.getElementById('signOutBtn');
const addNewsBtn        = document.getElementById('addNewsBtn');

// Stats
const totalCasesEl      = document.getElementById('totalCases');
const verifiedCasesEl   = document.getElementById('verifiedCases');
const arrestedCasesEl   = document.getElementById('arrestedCases');
const convictedCasesEl  = document.getElementById('convictedCases');

// Controls
const searchInput       = document.getElementById('searchInput');
const filterVerification = document.getElementById('filterVerification');
const filterArrest      = document.getElementById('filterArrest');
const sortSelect        = document.getElementById('sortSelect');
const trendingItems     = document.getElementById('trendingItems');

// News grid / states
const newsGrid          = document.getElementById('newsGrid');
const loadingState      = document.getElementById('loadingState');
const emptyState        = document.getElementById('emptyState');

// News modal
const newsModalOverlay  = document.getElementById('newsModalOverlay');
const newsForm          = document.getElementById('newsForm');
const newsTitleInput    = document.getElementById('newsTitle');
const newsLinkInput     = document.getElementById('newsLink');
const closeNewsModal    = document.getElementById('closeNewsModal');
const cancelNewsModal   = document.getElementById('cancelNewsModal');

// Update modal
const updateModalOverlay = document.getElementById('updateModalOverlay');
const updateForm         = document.getElementById('updateForm');
const updateNewsIdInput  = document.getElementById('updateNewsId');
const updateIndexInput   = document.getElementById('updateIndex');
const updateArrestedSel  = document.getElementById('updateArrested');
const updateNumArrested  = document.getElementById('updateNumArrested');
const updateBailSel      = document.getElementById('updateBail');
const updateVerdictSel   = document.getElementById('updateVerdict');
const updateDescInput    = document.getElementById('updateDescription');
const closeUpdateModal   = document.getElementById('closeUpdateModal');
const cancelUpdateModal  = document.getElementById('cancelUpdateModal');

// Toast
const toastContainer    = document.getElementById('toastContainer');

// Footer year
const footerYear        = document.getElementById('footerYear');
if (footerYear) footerYear.textContent = new Date().getFullYear();

/* ============================================================
   2. Application State
   ============================================================ */
let currentUser  = null;  // Firebase Auth user
let allNews      = [];    // Full news list from Firestore
let unsubscribe  = null;  // Firestore listener unsubscribe handle

/* ============================================================
   3. Dark / Light Mode
   ============================================================ */
(function initTheme() {
  const saved = localStorage.getItem('bikrito-theme') || 'light';
  applyTheme(saved);
})();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('bikrito-theme', theme);
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  // Re-render charts to match the new theme colors
  if (allNews.length > 0) {
    setTimeout(() => renderCharts(allNews), 50);
  }
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   4. Firebase Authentication
   ============================================================ */
auth.onAuthStateChanged(user => {
  currentUser = user;
  updateAuthUI(user);
  // Re-render cards so vote/edit buttons reflect auth state
  renderNews(getFilteredSortedNews());
});

function updateAuthUI(user) {
  if (user) {
    authBtn.classList.add('hidden');
    userInfoEl.classList.remove('hidden');
    addNewsBtn.classList.remove('hidden');

    userAvatar.src = user.photoURL || '';
    userAvatar.alt = user.displayName || 'User';
    userNameEl.textContent = user.displayName || user.email || '';
  } else {
    authBtn.classList.remove('hidden');
    userInfoEl.classList.add('hidden');
    addNewsBtn.classList.add('hidden');
  }
}

// Sign in with Google
authBtn.addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).catch(err => {
    showToast(`Sign-in failed: ${err.message}`, 'error');
  });
});

// Sign out
signOutBtn.addEventListener('click', () => {
  auth.signOut().then(() => showToast('Signed out successfully.', 'info'));
});

/* ============================================================
   5. Firestore Real-time Listener
   ============================================================ */
function startNewsListener() {
  if (unsubscribe) unsubscribe(); // Clean up previous listener

  const query = db.collection('news').orderBy('timestamp', 'desc');

  unsubscribe = query.onSnapshot(snapshot => {
    allNews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateStats(allNews);
    updateTrending(allNews);
    renderCharts(allNews);
    renderNews(getFilteredSortedNews());
    loadingState.classList.add('hidden');
  }, err => {
    console.error('[Firestore] Listener error:', err);
    loadingState.classList.add('hidden');
    showToast('Failed to load news. Check Firebase config.', 'error');
  });
}

// Start listening when page loads
startNewsListener();

/* ============================================================
   6. Analytics / Stats
   ============================================================ */
function updateStats(news) {
  if (!news) return;

  let verified  = 0;
  let arrested  = 0;
  let convicted = 0;

  news.forEach(n => {
    const status = getVerificationStatus(n.votes || 0);
    if (status === 'verified') verified++;

    const updates = n.case_updates || [];
    if (updates.length > 0) {
      const latest = updates[updates.length - 1];
      if (latest.arrested === 'yes' || latest.arrested === 'partial') arrested++;
      if (latest.verdict === 'convicted') convicted++;
    }
  });

  if (totalCasesEl)    totalCasesEl.textContent    = news.length;
  if (verifiedCasesEl) verifiedCasesEl.textContent  = verified;
  if (arrestedCasesEl) arrestedCasesEl.textContent  = arrested;
  if (convictedCasesEl) convictedCasesEl.textContent = convicted;
}

/* ============================================================
   7. Trending Strip
   ============================================================ */
function updateTrending(news) {
  if (!trendingItems) return;

  // Top 5 by votes
  const top = [...news]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  trendingItems.innerHTML = top.map(n => `
    <span class="trending-tag" data-id="${n.id}" title="${escapeHtml(n.title)}">
      ${escapeHtml(truncate(n.title, 30))}
    </span>
  `).join('');

  // Clicking a trending tag scrolls to that card
  trendingItems.querySelectorAll('.trending-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const card = newsGrid.querySelector(`[data-id="${tag.dataset.id}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

/* ============================================================
   8. Search / Filter / Sort
   ============================================================ */
function getFilteredSortedNews() {
  const query  = (searchInput.value || '').toLowerCase().trim();
  const verif  = filterVerification.value;
  const arrest = filterArrest.value;
  const sort   = sortSelect.value;

  let filtered = allNews.filter(n => {
    // Search by title
    if (query && !n.title?.toLowerCase().includes(query)) return false;

    // Filter by verification
    if (verif !== 'all') {
      const s = getVerificationStatus(n.votes || 0);
      if (s !== verif) return false;
    }

    // Filter by arrest status (latest update)
    if (arrest !== 'all') {
      const updates = n.case_updates || [];
      if (updates.length === 0) return arrest === 'no';
      const latest = updates[updates.length - 1];
      if ((latest.arrested || 'unknown') !== arrest) return false;
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    switch (sort) {
      case 'oldest':     return tsValue(a.timestamp) - tsValue(b.timestamp);
      case 'most_votes': return (b.votes || 0) - (a.votes || 0);
      case 'most_verified': {
        const sa = getVerificationStatus(a.votes || 0);
        const sb = getVerificationStatus(b.votes || 0);
        const rank = { verified: 3, partial: 2, unverified: 1 };
        return (rank[sb] || 0) - (rank[sa] || 0);
      }
      default: // 'latest'
        return tsValue(b.timestamp) - tsValue(a.timestamp);
    }
  });

  return filtered;
}

function tsValue(ts) {
  if (!ts) return 0;
  return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
}

// Attach filter/sort listeners
[searchInput, filterVerification, filterArrest, sortSelect].forEach(el => {
  el.addEventListener('input', () => renderNews(getFilteredSortedNews()));
  el.addEventListener('change', () => renderNews(getFilteredSortedNews()));
});

/* ============================================================
   9. Render News Cards
   ============================================================ */
function renderNews(items) {
  newsGrid.innerHTML = '';

  if (!items || items.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  items.forEach(newsDoc => {
    const card = createNewsCard(
      newsDoc,
      currentUser,
      handleVote,
      openAddUpdateModal,
      openEditUpdateModal
    );
    newsGrid.appendChild(card);
  });

  // Attach edit-update listeners (event delegation on grid)
  newsGrid.querySelectorAll('[data-action="edit-update"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const newsId = btn.dataset.newsId;
      const index  = parseInt(btn.dataset.index, 10);
      const news   = allNews.find(n => n.id === newsId);
      if (news) openEditUpdateModal(newsId, index, news.case_updates[index]);
    });
  });
}

/* ============================================================
   10. Voting Logic
   ============================================================ */
async function handleVote(newsId, voteValue) {
  if (!currentUser) { showToast('Sign in to vote.', 'info'); return; }

  const uid    = currentUser.uid;
  const docRef = db.collection('news').doc(newsId);

  try {
    await db.runTransaction(async transaction => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error('News not found.');

      const data    = snap.data();
      const voters  = data.voters || {};
      const prevVote = voters[uid];

      // Toggle: clicking the same vote removes it
      if (prevVote === voteValue) {
        // Remove vote
        delete voters[uid];
      } else {
        voters[uid] = voteValue;
      }

      // Recalculate total votes (count all votes as +1 each)
      const totalVotes = Object.keys(voters).length;

      transaction.update(docRef, { voters, votes: totalVotes });
    });
  } catch (err) {
    console.error('[vote] Error:', err);
    showToast('Failed to record vote. Please try again.', 'error');
  }
}

/* ============================================================
   11. Add News Modal
   ============================================================ */
addNewsBtn.addEventListener('click', openAddNewsModal);

function openAddNewsModal() {
  newsTitleInput.value = '';
  newsLinkInput.value  = '';
  newsModalOverlay.classList.remove('hidden');
  newsTitleInput.focus();
}

function closeNewsModalFn() {
  newsModalOverlay.classList.add('hidden');
}

closeNewsModal.addEventListener('click', closeNewsModalFn);
cancelNewsModal.addEventListener('click', closeNewsModalFn);
newsModalOverlay.addEventListener('click', e => {
  if (e.target === newsModalOverlay) closeNewsModalFn();
});

newsForm.addEventListener('submit', async e => {
  e.preventDefault();

  const title = newsTitleInput.value.trim();
  const link  = newsLinkInput.value.trim();

  if (!title) { showToast('Title is required.', 'error'); return; }
  if (!link || !isValidUrl(link)) { showToast('Please enter a valid URL.', 'error'); return; }
  if (!currentUser) { showToast('Please sign in first.', 'error'); return; }

  const submitBtn = document.getElementById('newsSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

  try {
    await db.collection('news').add({
      title,
      link,
      votes: 0,
      voters: {},
      case_updates: [],
      submitted_by: currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('News entry submitted!', 'success');
    closeNewsModalFn();
  } catch (err) {
    console.error('[addNews] Error:', err);
    showToast('Failed to submit news. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
  }
});

/* ============================================================
   12. Case Update Modal (Add / Edit)
   ============================================================ */
function openAddUpdateModal(newsId) {
  document.getElementById('updateModalTitle').textContent = 'Submit Case Update';
  updateNewsIdInput.value = newsId;
  updateIndexInput.value  = '-1';
  // Reset fields
  updateArrestedSel.value  = 'unknown';
  updateNumArrested.value  = '0';
  updateBailSel.value      = 'unknown';
  updateVerdictSel.value   = 'pending';
  updateDescInput.value    = '';
  updateModalOverlay.classList.remove('hidden');
  updateDescInput.focus();
}

function openEditUpdateModal(newsId, index, updateData) {
  document.getElementById('updateModalTitle').textContent = 'Edit Case Update';
  updateNewsIdInput.value  = newsId;
  updateIndexInput.value   = index;
  updateArrestedSel.value  = updateData.arrested   || 'unknown';
  updateNumArrested.value  = updateData.num_arrested || 0;
  updateBailSel.value      = updateData.bail_status || 'unknown';
  updateVerdictSel.value   = updateData.verdict     || 'pending';
  updateDescInput.value    = updateData.case_description || '';
  updateModalOverlay.classList.remove('hidden');
  updateDescInput.focus();
}

function closeUpdateModalFn() {
  updateModalOverlay.classList.add('hidden');
}

closeUpdateModal.addEventListener('click', closeUpdateModalFn);
cancelUpdateModal.addEventListener('click', closeUpdateModalFn);
updateModalOverlay.addEventListener('click', e => {
  if (e.target === updateModalOverlay) closeUpdateModalFn();
});

updateForm.addEventListener('submit', async e => {
  e.preventDefault();

  if (!currentUser) { showToast('Please sign in first.', 'error'); return; }

  const newsId      = updateNewsIdInput.value;
  const editIndex   = parseInt(updateIndexInput.value, 10);
  const description = updateDescInput.value.trim();

  if (!description) { showToast('Case description is required.', 'error'); return; }

  const submitBtn = document.getElementById('updateSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

  const updateEntry = {
    user:             currentUser.uid,
    user_name:        currentUser.displayName || currentUser.email || 'Anonymous',
    arrested:         updateArrestedSel.value,
    num_arrested:     parseInt(updateNumArrested.value, 10) || 0,
    bail_status:      updateBailSel.value,
    verdict:          updateVerdictSel.value,
    case_description: description,
    timestamp:        firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = db.collection('news').doc(newsId);
    const snap   = await docRef.get();
    if (!snap.exists) throw new Error('News not found.');

    const data    = snap.data();
    const updates = [...(data.case_updates || [])];

    if (editIndex >= 0) {
      // Edit: verify ownership
      if (updates[editIndex]?.user !== currentUser.uid) {
        showToast('You can only edit your own updates.', 'error');
        return;
      }
      updates[editIndex] = updateEntry;
    } else {
      // Add new
      updates.push(updateEntry);
    }

    await docRef.update({ case_updates: updates });
    showToast(editIndex >= 0 ? 'Update saved!' : 'Case update added!', 'success');
    closeUpdateModalFn();
  } catch (err) {
    console.error('[caseUpdate] Error:', err);
    showToast('Failed to save update. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Update';
  }
});

/* ============================================================
   13. Toast Notifications
   ============================================================ */
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escapeHtml(message)}`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ============================================================
   14. Utility Helpers
   ============================================================ */
function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// escapeHtml is already defined in newsCard.js (loaded before app.js)
// It is referenced here as a global — no re-declaration needed.
