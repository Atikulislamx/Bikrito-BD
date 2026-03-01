/**
 * components/newsCard.js
 * Renders a single news card element including header, vote row,
 * footer actions (expand, share, update), and the collapsible
 * case-updates panel.
 *
 * Depends on: timeline.js (renderTimeline)
 */

/**
 * Determine the verification status label for a news document.
 * - verified   : votes >= VERIFIED_THRESHOLD
 * - partial    : votes >= PARTIAL_THRESHOLD
 * - unverified : votes < PARTIAL_THRESHOLD
 */
function getVerificationStatus(votes) {
  const VERIFIED_THRESHOLD = 10;
  const PARTIAL_THRESHOLD  = 3;

  if (votes >= VERIFIED_THRESHOLD) return 'verified';
  if (votes >= PARTIAL_THRESHOLD)  return 'partial';
  return 'unverified';
}

/**
 * Returns a human-readable label for the verification status.
 */
function getStatusLabel(status) {
  const labels = { verified: 'Verified', partial: 'Partially Verified', unverified: 'Unverified' };
  return labels[status] || 'Unverified';
}

/**
 * Format a Firestore Timestamp (or Date) to a readable string.
 */
function formatTimestamp(ts) {
  if (!ts) return 'Unknown date';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Encode a string for safe use in URLs (for share links).
 */
function safeEncode(str) {
  return encodeURIComponent(str || '');
}

/**
 * Build share links for a news entry.
 */
function buildShareLinks(title, link) {
  const pageUrl = safeEncode(link || window.location.href);
  const text    = safeEncode(`[Bikrito-BD] ${title}`);
  return {
    fb: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
    tw: `https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`,
    wa: `https://wa.me/?text=${text}%20${pageUrl}`
  };
}

/**
 * Create and return a news card DOM element.
 *
 * @param {Object} newsDoc   - Firestore document data including `id`
 * @param {Object|null} currentUser - Firebase Auth user (or null)
 * @param {Function} onVote         - Called with (newsId, voteValue) when user votes
 * @param {Function} onAddUpdate    - Called with (newsId) to open case-update modal
 * @param {Function} onEditUpdate   - Called with (newsId, updateIndex, updateData)
 */
function createNewsCard(newsDoc, currentUser, onVote, onAddUpdate, onEditUpdate) {
  const {
    id,
    title   = 'Untitled',
    link    = '#',
    votes   = 0,
    voters  = {},
    case_updates = [],
    timestamp
  } = newsDoc;

  const status      = getVerificationStatus(votes);
  const statusLabel = getStatusLabel(status);
  const shareLinks  = buildShareLinks(title, link);

  // ---- Outer card ----
  const card = document.createElement('article');
  card.className = `news-card status-${status}`;
  card.dataset.id = id;

  // ---- Header ----
  card.innerHTML = `
    <div class="card-header">
      <span class="card-status-badge badge-${status}">${statusLabel}</span>
      <h3 class="card-title">
        <a href="${link}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>
      </h3>
    </div>

    <div class="card-meta">
      <span><i class="fas fa-calendar-alt"></i> ${formatTimestamp(timestamp)}</span>
      <span><i class="fas fa-layer-group"></i> ${case_updates.length} update${case_updates.length !== 1 ? 's' : ''}</span>
    </div>

    <!-- Vote row -->
    <div class="card-vote-row" id="voteRow-${id}">
      ${buildVoteRow(id, votes, voters, currentUser)}
    </div>

    <!-- Card footer -->
    <div class="card-footer">
      <div class="card-footer-actions">
        <button class="btn-expand btn" data-id="${id}" aria-expanded="false">
          <i class="fas fa-chevron-down"></i> Case Updates (${case_updates.length})
        </button>
        ${currentUser ? `
          <button class="btn btn-sm btn-outline" data-action="add-update" data-id="${id}">
            <i class="fas fa-plus"></i> Add Update
          </button>` : ''}
      </div>
      <div class="share-btns">
        <a href="${shareLinks.fb}" target="_blank" rel="noopener noreferrer" class="btn-share fb" title="Share on Facebook" aria-label="Share on Facebook">
          <i class="fab fa-facebook-f"></i>
        </a>
        <a href="${shareLinks.tw}" target="_blank" rel="noopener noreferrer" class="btn-share tw" title="Share on Twitter" aria-label="Share on Twitter">
          <i class="fab fa-twitter"></i>
        </a>
        <a href="${shareLinks.wa}" target="_blank" rel="noopener noreferrer" class="btn-share wa" title="Share on WhatsApp" aria-label="Share on WhatsApp">
          <i class="fab fa-whatsapp"></i>
        </a>
      </div>
    </div>

    <!-- Collapsible case updates panel -->
    <div class="card-updates" id="updates-${id}">
      <div class="updates-header">
        <span class="updates-label"><i class="fas fa-history"></i> Case Timeline</span>
      </div>
      <div class="timeline-container" id="timeline-${id}">
        ${renderTimeline(case_updates, currentUser, id, onEditUpdate)}
      </div>
    </div>
  `;

  // ---- Bind expand/collapse ----
  const expandBtn = card.querySelector('.btn-expand');
  const updatesPanel = card.querySelector(`#updates-${id}`);
  expandBtn.addEventListener('click', () => {
    const isOpen = updatesPanel.classList.toggle('open');
    expandBtn.setAttribute('aria-expanded', isOpen);
    const icon = expandBtn.querySelector('i');
    icon.className = isOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
  });

  // ---- Bind vote buttons ----
  card.addEventListener('click', (e) => {
    const voteBtn = e.target.closest('[data-vote]');
    if (voteBtn) {
      e.preventDefault();
      if (!currentUser) {
        showToast('Please sign in to vote.', 'info');
        return;
      }
      onVote(id, voteBtn.dataset.vote);
    }

    const addUpdateBtn = e.target.closest('[data-action="add-update"]');
    if (addUpdateBtn) {
      if (!currentUser) { showToast('Please sign in to add updates.', 'info'); return; }
      onAddUpdate(id);
    }
  });

  return card;
}

/**
 * Build the vote row HTML.
 */
function buildVoteRow(newsId, votes, voters, currentUser) {
  const uid        = currentUser ? currentUser.uid : null;
  const userVote   = uid && voters ? voters[uid] : null;
  const trueVotes  = countVoteType(voters, 'true');
  const falseVotes = countVoteType(voters, 'false');
  const partialVotes = countVoteType(voters, 'partial');

  return `
    <button class="btn btn-vote ${userVote === 'true' ? 'active' : ''}" data-vote="true" title="Vote True">
      <i class="fas fa-thumbs-up"></i> True <span class="vote-count">${trueVotes}</span>
    </button>
    <button class="btn btn-vote ${userVote === 'partial' ? 'active' : ''}" data-vote="partial" title="Vote Partial">
      <i class="fas fa-minus-circle"></i> Partial <span class="vote-count">${partialVotes}</span>
    </button>
    <button class="btn btn-vote ${userVote === 'false' ? 'active' : ''}" data-vote="false" title="Vote False">
      <i class="fas fa-thumbs-down"></i> False <span class="vote-count">${falseVotes}</span>
    </button>
    <span class="vote-count" style="margin-left:auto; font-size:0.78rem; color: var(--color-text-light);">
      <i class="fas fa-poll"></i> ${votes} total
    </span>
  `;
}

/**
 * Count how many voters voted for a given value.
 */
function countVoteType(voters, value) {
  if (!voters) return 0;
  return Object.values(voters).filter(v => v === value).length;
}

/**
 * Minimal HTML escape to prevent XSS.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
