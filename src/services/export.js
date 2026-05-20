function escapeCsv(val) {
  const s = String(val ?? '').replace(/"/g, '""');
  return /[,"\n\r]/.test(s) ? `"${s}"` : s;
}

function toRow(cells) {
  return cells.map(escapeCsv).join(',');
}

/**
 * Exports leads + any generated outreach sequences to CSV.
 *
 * @param {object[]} leads         - current filtered lead list
 * @param {object}   sequences     - { [leadId]: email[] } from dashboard state
 * @param {string}   eventName
 */
export function exportLeadsCSV(leads, _sequences = {}, eventName = 'export') {
  const headers = [
    'Company', 'Contact', 'Title', 'Email',
    'Category', 'Fit Score', 'Status', 'Rationale',
  ];

  const rows = leads.map(lead => toRow([
    lead.company || lead.name,
    lead.contact,
    lead.title,
    lead.email,
    lead.category,
    lead.fit_score,
    lead.outreach_status,
    lead.rationale,
  ]));

  const csv = [toRow(headers), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${eventName.replace(/\s+/g, '-').toLowerCase()}-sponsor-leads.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
