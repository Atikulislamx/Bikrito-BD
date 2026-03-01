/**
 * components/timeline.js
 * Renders the case-update timeline for a news card.
 * Returns an HTML string (injected via innerHTML).
 *
 * NOTE: escapeHtml and formatTimestamp are defined here first
 * (timeline.js loads before newsCard.js). newsCard.js redefines
 * them identically as regular function declarations.
 */

/* ---- Shared helpers ---- */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

function formatTimestamp(ts) {
  if (!ts) return 'Unknown date';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---- Timeline renderers ---- */

/**
 * Renders a timeline of case updates.
 *
 * @param {Array}  updates       - Array of case_update objects
 * @param {Object} currentUser   - Firebase Auth user (or null)
 * @param {string} newsId        - Parent news document ID
 * @param {Function} onEdit      - Called with (newsId, index, updateData) when Edit is clicked
 * @returns {string}             - HTML string
 */
function renderTimeline(updates, currentUser, newsId, onEdit) {
  if (!updates || updates.length === 0) {
    return `<p class="timeline-empty"><i class="fas fa-info-circle"></i> No case updates yet.</p>`;
  }

  // Sort chronologically (oldest first)
  const sorted = [...updates].sort((a, b) => {
    const ta = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : 0;
    const tb = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : 0;
    return ta - tb;
  });

  const html = sorted.map((update, originalIndex) => {
    // Find original index for edit purposes
    const idx = updates.indexOf(update);
    return renderTimelineItem(update, idx, currentUser, newsId, onEdit);
  }).join('');

  return `<div class="timeline">${html}</div>`;
}

/**
 * Renders a single timeline item.
 */
function renderTimelineItem(update, index, currentUser, newsId, onEdit) {
  const {
    user         = '',
    user_name    = 'Anonymous',
    arrested     = 'unknown',
    num_arrested = 0,
    bail_status  = 'unknown',
    verdict      = 'pending',
    case_description = '',
    timestamp
  } = update;

  const isOwner    = currentUser && currentUser.uid === user;
  const dateStr    = formatTimestamp(timestamp);
  const verdictCls = `verdict-${verdict}`;

  // Bail label
  const bailLabels = { yes: 'Bail Granted', no: 'Bail Denied', partial: 'Bail Partial', unknown: '' };
  const bailLabel  = bailLabels[bail_status] || '';

  // Arrest label
  const arrestLabels = { yes: 'Arrested', partial: 'Partial Arrest', no: 'No Arrest', unknown: 'Arrest Unknown' };
  const arrestLabel  = arrestLabels[arrested] || '';

  // Verdict label
  const verdictLabels = { convicted: 'Convicted', acquitted: 'Acquitted', pending: 'Pending' };
  const verdictLabel  = verdictLabels[verdict] || 'Pending';

  return `
    <div class="timeline-item ${verdictCls}" data-index="${index}">
      <div class="timeline-meta">
        <span class="timeline-badge badge-arrested-${arrested}">${escapeHtml(arrestLabel)}</span>
        ${num_arrested > 0 ? `<span class="timeline-badge" style="background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text-muted);">${num_arrested} arrested</span>` : ''}
        <span class="timeline-badge badge-verdict-${verdict}">${escapeHtml(verdictLabel)}</span>
        ${bailLabel ? `<span class="timeline-badge" style="background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text-muted);">${escapeHtml(bailLabel)}</span>` : ''}
        <span class="timeline-user"><i class="fas fa-user-circle"></i> ${escapeHtml(user_name)}</span>
      </div>
      <p class="timeline-desc">${escapeHtml(case_description)}</p>
      <div class="timeline-footer">
        <span><i class="fas fa-clock"></i> ${dateStr}</span>
        ${isOwner ? `
          <div class="timeline-edit-actions">
            <button class="btn btn-sm btn-outline" data-action="edit-update" data-news-id="${newsId}" data-index="${index}">
              <i class="fas fa-edit"></i> Edit
            </button>
          </div>` : ''}
      </div>
    </div>
  `;
}
