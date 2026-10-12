import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

const THRESHOLD = 75;

const emptyForm = {
  title: '',
  organizer: '',
  category: 'Hackathon',
  venue: '',
  start: '',
  end: '',
  url: '',
  purpose: '',
};

const css = `
*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#172033;font-family:Inter,system-ui,sans-serif}
button,input,select,textarea{font:inherit}button{cursor:pointer}
.app{display:flex;min-height:100vh}.sidebar{width:225px;flex-shrink:0;background:#101b32;color:#e8eefc;padding:20px 14px}
.brand{font-size:23px;font-weight:800;margin:5px 10px}.brand span{color:#65a5ff}
.subbrand{font-size:10px;color:#9aa9c4;margin:4px 10px 22px}
.label{font-size:11px;color:#9aa9c4;margin:0 10px 7px}
.role{width:100%;padding:10px;background:#1c2b49;color:white;border:1px solid #344665;border-radius:8px;margin-bottom:18px}
.nav{display:grid;gap:5px}.nav button{text-align:left;border:0;background:transparent;color:#bac7dc;padding:11px;border-radius:8px;font-size:12px}
.nav button.active,.nav button:hover{background:#263c61;color:white}.note{font-size:11px;color:#91a2c0;line-height:1.6;margin:22px 10px}
.main{flex:1;min-width:0;padding:25px}.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
h1{font-size:25px;margin:0 0 5px}h2{font-size:16px;margin:0}.muted{font-size:12px;color:#7a879c}
.pill{padding:9px 12px;border:1px solid #e0e6ef;background:white;border-radius:25px;font-size:12px}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:17px}
.stat,.panel{background:white;border:1px solid #e5eaf2;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 2px 8px #162c4d05}
.stat-label{font-size:12px;color:#77839a}.number{font-size:27px;font-weight:750;margin-top:8px}
.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.grid{display:grid;grid-template-columns:1.3fr 1fr;gap:15px}
.btn{border:0;border-radius:8px;padding:9px 12px;background:#245eea;color:white;font-size:12px;font-weight:650}
.btn.secondary{background:#edf3ff;color:#2455cb}.btn.ghost{background:white;border:1px solid #dce3ed;color:#34415a}
.btn.danger{background:#fff0f0;color:#b83232}.btn.small{padding:7px 9px;font-size:11px}
.btn:disabled{opacity:.45;cursor:not-allowed}.actions,.toolbar,.form-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;min-width:650px}th,td{text-align:left;padding:11px;border-bottom:1px solid #edf0f5;font-size:12px;vertical-align:top}
th{background:#fafbfd;color:#8590a3;text-transform:uppercase;font-size:10px}td{color:#435069}td strong{color:#202d43}
.table-wrap,.preview{overflow-x:auto}.badge{display:inline-block;border-radius:20px;padding:5px 8px;font-size:10px;font-weight:700;background:#edf1f7;color:#57657c}
.green{background:#e5f8ed;color:#147a47}.red{background:#fff0f0;color:#b72e39}.yellow{background:#fff6dc;color:#956b08}.blue{background:#eaf1ff;color:#2759bf}
.alert{padding:12px 14px;border-radius:9px;background:#edf4ff;color:#2453a9;font-size:12px;line-height:1.5;margin:12px 0}
.alert.success{background:#e9f9ef;color:#166b3e}.alert.error{background:#fff0f0;color:#a72e39}.alert.warning{background:#fff7e3;color:#8c650b}
.search{max-width:280px;width:100%;border:1px solid #dce3ed;border-radius:8px;padding:10px;background:white;font-size:12px}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.field{display:flex;flex-direction:column;gap:6px}.field.full{grid-column:1/-1}
.field label{font-size:12px;font-weight:650;color:#47536a}.field input,.field select,.field textarea{width:100%;border:1px solid #dce3ed;border-radius:8px;padding:10px;background:white;color:#172033}
.field textarea{min-height:85px;resize:vertical}.upload{border:1.5px dashed #b9c8df;background:#f8faff;border-radius:12px;padding:18px}
.upload input{max-width:100%;margin-top:10px;font-size:12px}.empty{text-align:center;padding:25px;color:#8792a5;font-size:13px}
.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.detail{padding:12px;background:#f8faff;border-radius:8px;font-size:12px}
.detail small{display:block;color:#7d8aa0;margin-bottom:5px}.log{border-left:2px solid #cbd8f0;padding:3px 0 14px 12px;margin-left:5px;font-size:12px;color:#58657c}
@media(max-width:950px){.sidebar{width:195px}.main{padding:16px}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.grid{grid-template-columns:1fr}}
@media(max-width:620px){.app{display:block}.sidebar{width:100%;padding:13px}.subbrand,.note{display:none}.role{margin-bottom:10px}.nav{grid-template-columns:repeat(2,minmax(0,1fr))}.main{padding:12px}.stat{padding:12px}.number{font-size:22px}.form-grid,.details{grid-template-columns:1fr}.field.full{grid-column:auto}h1{font-size:22px}}

/* Responsive refinements for phones, tablets, and narrow desktop windows */
html,body,#root{width:100%;min-height:100%;margin:0}
body{overflow-x:hidden}
.app,.main,.panel,.stat{min-width:0}
button,input,select,textarea{max-width:100%}
.table-wrap{width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.table-wrap table{min-width:650px}
.panel-head>*{min-width:0}
.panel-head .muted{line-height:1.5}
.pill{max-width:100%;overflow-wrap:anywhere}
@media(max-width:950px){
  .sidebar{width:190px;padding:15px 11px}
  .main{padding:18px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .grid{grid-template-columns:minmax(0,1fr)}
  .panel{padding:14px}
}
@media(max-width:620px){
  .app{display:flex;flex-direction:column}
  .sidebar{width:100%;flex:none;padding:12px}
  .brand{font-size:21px;margin:2px 3px}
  .label{margin:10px 3px 6px}
  .role{margin-bottom:10px;padding:10px}
  .nav{display:flex;gap:7px;overflow-x:auto;padding:2px 0 7px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
  .nav button{flex:0 0 auto;white-space:nowrap;padding:10px 12px}
  .main{width:100%;padding:12px}
  .top{align-items:flex-start;flex-direction:column;gap:9px;margin-bottom:14px}
  h1{font-size:21px;overflow-wrap:anywhere}
  .top .pill{white-space:normal}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .stat{padding:11px;margin-bottom:8px}
  .stat-label{font-size:11px;line-height:1.4}
  .number{font-size:22px;margin-top:5px}
  .panel{padding:12px;margin-bottom:12px;border-radius:10px}
  .panel-head{align-items:flex-start;flex-direction:column;gap:10px}
  .panel-head .actions,.toolbar,.form-actions{width:100%;align-items:stretch}
  .panel-head .actions .btn,.form-actions .btn{flex:1 1 auto}
  .toolbar{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
  .search{max-width:none;width:100%;min-width:0}
  .form-grid,.details{grid-template-columns:minmax(0,1fr);gap:11px}
  .field.full{grid-column:auto}
  .field input,.field select,.field textarea{font-size:16px;min-width:0}
  .actions{gap:6px}
  .actions .btn{white-space:normal}
  .detail{min-width:0;overflow-wrap:anywhere}
  .detail strong{overflow-wrap:anywhere}
  .alert{overflow-wrap:anywhere}
  .upload input{width:100%}
}
@media(max-width:380px){
  .main{padding:9px}
  .stats{grid-template-columns:minmax(0,1fr)}
  .panel{padding:10px}
  .brand{font-size:19px}
  .nav button{font-size:11px;padding:9px 10px}
  .btn{padding:10px;font-size:12px}
}
`;

function mapRequest(row) {
  return {
    id: row.id,
    title: row.title || '',
    student: row.student_name || '',
    roll: row.roll_number || '',
    group: row.group_name || '',
    organizer: row.organizer || '',
    category: row.category || 'Other',
    venue: row.venue || '',
    start: row.start_at ? String(row.start_at).slice(0, 10) : '',
    end: row.end_at ? String(row.end_at).slice(0, 10) : '',
    url: row.event_url || '',
    purpose: row.purpose || '',
    status: row.status || 'Submitted',
    remarks: row.proctor_remarks || '',
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    created: row.created_at || '',
    log: Array.isArray(row.audit_log) ? row.audit_log : [],
  };
}

function statusClass(status) {
  if (status === 'Approved') return 'green';
  if (['Cancelled', 'Rejected'].includes(status)) return 'red';
  if (status === 'Submitted') return 'yellow';
  return '';
}

function downloadCSV(filename, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text =
    '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App({ user }) {
  const role =
    user?.role === 'proctor'
      ? 'Proctor'
      : user?.role === 'in_charge'
      ? 'In-Charge'
      : user?.role === 'admin'
      ? 'Admin'
      : 'Student';

  const studentRoll = user?.roll_number || '';
  const studentName = user?.full_name || 'Student';
  const studentGroup = user?.group_name || '';
  const proctorGroup = user?.group_name || '';

  const [page, setPage] = useState('Overview');
  const [requests, setRequests] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const tell = useCallback((text, type = 'info') => {
    setNotice({ text, type });
  }, []);

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('event_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tell(`Could not load requests: ${error.message}`, 'error');
      return;
    }
    setRequests((data || []).map(mapRequest));
  }, [tell]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) tell(`Could not load requests: ${error.message}`, 'error');
      else setRequests((data || []).map(mapRequest));
      setLoadingRequests(false);
    }

    load();
    const timer = setInterval(async () => {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (!error) setRequests((data || []).map(mapRequest));
    }, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user?.id, tell]);

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      if (role !== 'Proctor') {
        setRegisteredStudents([]);
        return;
      }
      if (!proctorGroup) {
        setRegisteredStudents([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, roll_number, group_name')
        .eq('role', 'student')
        .eq('group_name', proctorGroup)
        .order('roll_number');

      if (!active) return;
      if (error)
        tell(`Could not load assigned students: ${error.message}`, 'error');
      else setRegisteredStudents(data || []);
    }

    loadStudents();
    return () => {
      active = false;
    };
  }, [role, proctorGroup, user?.id, tell]);

  const visibleRequests = useMemo(() => {
    if (role === 'Student') {
      return requests.filter(
        (r) => r.roll === studentRoll || r.student_id === user?.id
      );
    }
    if (role === 'Proctor') {
      return requests.filter((r) => r.group === proctorGroup);
    }
    if (role === 'In-Charge' || role === 'Admin') return requests;
    return [];
  }, [requests, role, studentRoll, proctorGroup, user?.id]);

  const filteredRequests = useMemo(
    () =>
      visibleRequests.filter((r) => {
        const query =
          `${r.id} ${r.title} ${r.student} ${r.roll} ${r.status}`.toLowerCase();
        return (
          query.includes(search.toLowerCase()) &&
          (filter === 'All' || r.status === filter)
        );
      }),
    [visibleRequests, search, filter]
  );

  const selected = requests.find((r) => r.id === selectedId);
  const pending = visibleRequests.filter(
    (r) => r.status === 'Submitted'
  ).length;
  const approved = visibleRequests.filter(
    (r) => r.status === 'Approved'
  ).length;
  const cancelled = visibleRequests.filter(
    (r) => r.status === 'Cancelled'
  ).length;

  const nav =
    role === 'Student'
      ? ['Overview', 'My Requests', 'New Event Request']
      : role === 'Proctor'
      ? ['Overview', 'Group Requests', 'Students']
      : ['Overview', 'All Requests'];

  function openNewRequest() {
    setForm(emptyForm);
    setPage('New Event Request');
    setNotice(null);
  }

  async function saveRequest(event) {
    event.preventDefault();

    if (!user?.id || !studentRoll || !studentName) {
      tell('Your signed-in profile is missing required details.', 'error');
      return;
    }
    if (!studentGroup) {
      tell(
        'Your account has no assigned group. Contact the administrator.',
        'error'
      );
      return;
    }
    if (form.end < form.start) {
      tell('End date cannot be before start date.', 'error');
      return;
    }

    setBusy(true);
    const now = new Date().toISOString();
    const payload = {
      student_id: user.id,
      student_name: studentName,
      roll_number: studentRoll,
      group_name: studentGroup,
      title: form.title.trim(),
      organizer: form.organizer.trim(),
      category: form.category,
      venue: form.venue.trim(),
      start_at: `${form.start}T00:00:00`,
      end_at: `${form.end}T23:59:59`,
      event_url: form.url.trim() || null,
      purpose: form.purpose.trim(),
      status: 'Submitted',
      proctor_remarks: null,
      attachments: [],
      audit_log: [
        { action: 'Submitted', by: studentName, date: now, reason: '' },
      ],
    };

    const { data, error } = await supabase
      .from('event_requests')
      .insert(payload)
      .select()
      .single();

    setBusy(false);
    if (error) {
      tell(`Request could not be submitted: ${error.message}`, 'error');
      return;
    }

    setRequests((old) => [mapRequest(data), ...old]);
    setForm(emptyForm);
    setPage('My Requests');
    tell('Your request was submitted successfully.', 'success');
  }

  async function decideRequest(request, status) {
    if (
      role !== 'Proctor' ||
      request.group !== proctorGroup ||
      request.status !== 'Submitted'
    ) {
      tell('This action is not allowed for this request.', 'error');
      return;
    }

    let reason = '';
    if (status === 'Cancelled') {
      const answer = window.prompt(
        'Reason for cancelling this request (optional):'
      );
      if (answer === null) return;
      reason = answer.trim();
    }

    setBusy(true);
    const now = new Date().toISOString();
    const oldLog = Array.isArray(request.log) ? request.log : [];
    const auditLog = [
      ...oldLog,
      {
        action: status,
        by: `Proctor${proctorGroup ? ` (${proctorGroup})` : ''}`,
        date: now,
        reason,
      },
    ];

    const { data, error } = await supabase
      .from('event_requests')
      .update({
        status,
        proctor_remarks: reason || null,
        audit_log: auditLog,
        updated_at: now,
      })
      .eq('id', request.id)
      .eq('status', 'Submitted')
      .select()
      .maybeSingle();

    setBusy(false);
    if (error) {
      tell(`Decision could not be saved: ${error.message}`, 'error');
      return;
    }
    if (!data) {
      tell(
        'No request was updated. It may already have been decided or your account lacks permission.',
        'error'
      );
      await loadRequests();
      return;
    }

    setRequests((old) =>
      old.map((r) => (r.id === request.id ? mapRequest(data) : r))
    );
    tell(`Request ${status.toLowerCase()} successfully.`, 'success');
  }

  function statusBadge(status) {
    return <span className={`badge ${statusClass(status)}`}>{status}</span>;
  }

  function exportRequests() {
    const rows = [
      [
        'reference',
        'title',
        'student',
        'roll',
        'group',
        'organizer',
        'category',
        'venue',
        'start',
        'end',
        'status',
        'remarks',
      ],
      ...filteredRequests.map((r) => [
        r.id,
        r.title,
        r.student,
        r.roll,
        r.group,
        r.organizer,
        r.category,
        r.venue,
        r.start,
        r.end,
        r.status,
        r.remarks,
      ]),
    ];
    downloadCSV('techpermit_requests.csv', rows);
  }

  function requestsPage() {
    const heading =
      role === 'Student'
        ? 'My Requests'
        : role === 'Proctor'
        ? `${proctorGroup || 'Assigned Group'} Requests`
        : 'All Requests';
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{heading}</h2>
            <div className="muted">
              Open a request to view its details, current decision, and audit
              trail.
            </div>
          </div>
          <div className="actions">
            <button className="btn secondary" onClick={exportRequests}>
              Export CSV
            </button>
            {role === 'Student' && (
              <button className="btn" onClick={openNewRequest}>
                + New Request
              </button>
            )}
            <button className="btn ghost" onClick={loadRequests}>
              Refresh
            </button>
          </div>
        </div>
        <div className="toolbar" style={{ marginBottom: 13 }}>
          <input
            className="search"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Submitted</option>
            <option>Approved</option>
            <option>Cancelled</option>
          </select>
        </div>
        {loadingRequests && (
          <div className="alert">Loading requests from the database…</div>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event / Reference</th>
                <th>Student / Group</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                    <div className="muted">
                      {r.id} · {r.category}
                    </div>
                  </td>
                  <td>
                    {r.student}
                    <div className="muted">
                      {r.roll} · {r.group}
                    </div>
                  </td>
                  <td>
                    {r.start}
                    <div className="muted">to {r.end}</div>
                  </td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn secondary small"
                        onClick={() => {
                          setSelectedId(r.id);
                          setPage('Request Details');
                        }}
                      >
                        View
                      </button>
                      {role === 'Proctor' && r.status === 'Submitted' && (
                        <>
                          <button
                            className="btn small"
                            disabled={busy}
                            onClick={() => decideRequest(r, 'Approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn danger small"
                            disabled={busy}
                            onClick={() => decideRequest(r, 'Cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredRequests.length && !loadingRequests && (
          <div className="empty">No requests match this view.</div>
        )}
      </section>
    );
  }

  function requestForm() {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>New Event Request</h2>
            <div className="muted">
              {studentName} · {studentRoll} ·{' '}
              {studentGroup || 'Group not assigned'}
            </div>
          </div>
        </div>
        <div className="alert">
          Your request will be saved to the shared database and routed to your
          assigned proctor.
        </div>
        <form onSubmit={saveRequest}>
          <div className="form-grid">
            <div className="field">
              <label>Event Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Organizer *</label>
              <input
                required
                value={form.organizer}
                onChange={(e) =>
                  setForm({ ...form, organizer: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {[
                  'Hackathon',
                  'Workshop',
                  'Conference',
                  'Competition',
                  'Seminar',
                  'Other',
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Venue / City *</label>
              <input
                required
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Start Date *</label>
              <input
                required
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div className="field">
              <label>End Date *</label>
              <input
                required
                type="date"
                min={form.start || new Date().toISOString().slice(0, 10)}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
            <div className="field full">
              <label>Event URL (optional)</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="field full">
              <label>Purpose *</label>
              <textarea
                required
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit Request'}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setPage('My Requests')}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  function detailsPage() {
    if (!selected || !visibleRequests.some((r) => r.id === selected.id)) {
      return (
        <section className="panel">
          <div className="empty">
            This request isn't available in this account's view.
          </div>
          <button
            className="btn"
            onClick={() =>
              setPage(
                role === 'Proctor'
                  ? 'Group Requests'
                  : role === 'Student'
                  ? 'My Requests'
                  : 'All Requests'
              )
            }
          >
            Back
          </button>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{selected.title}</h2>
            <div className="muted">{selected.id}</div>
          </div>
          <button
            className="btn ghost"
            onClick={() =>
              setPage(
                role === 'Proctor'
                  ? 'Group Requests'
                  : role === 'Student'
                  ? 'My Requests'
                  : 'All Requests'
              )
            }
          >
            ← Back
          </button>
        </div>
        <div className="details">
          {[
            ['Student', selected.student],
            ['Roll', selected.roll],
            ['Group', selected.group],
            ['Organizer', selected.organizer],
            ['Category', selected.category],
            ['Venue', selected.venue],
            ['Start', selected.start],
            ['End', selected.end],
            ['Status', selected.status],
            [
              'Created',
              selected.created
                ? new Date(selected.created).toLocaleString()
                : '—',
            ],
          ].map(([k, v]) => (
            <div className="detail" key={k}>
              <small>{k}</small>
              <strong>{v || '—'}</strong>
            </div>
          ))}
        </div>
        <div className="detail" style={{ marginTop: 10 }}>
          <small>Purpose</small>
          <strong>{selected.purpose || '—'}</strong>
        </div>
        {selected.remarks && (
          <div className="alert warning">{selected.remarks}</div>
        )}
        {selected.url && (
          <p>
            <a href={selected.url} target="_blank" rel="noreferrer">
              Open event website
            </a>
          </p>
        )}
        <h2 style={{ margin: '22px 0 14px' }}>Supporting Documents</h2>
        {(selected.attachments || []).length === 0 ? (
          <div className="muted">No supporting documents attached.</div>
        ) : (
          selected.attachments.map((a, i) => (
            <div
              className="detail"
              key={`${a.name}-${i}`}
              style={{ marginBottom: 8 }}
            >
              {a.name || `Attachment ${i + 1}`}
              {a.data && (
                <a
                  href={a.data}
                  download={a.name || 'attachment'}
                  style={{ marginLeft: 10 }}
                >
                  Download
                </a>
              )}
            </div>
          ))
        )}
        <h2 style={{ margin: '22px 0 14px' }}>Audit Trail</h2>
        {(selected.log || []).map((entry, i) => (
          <div className="log" key={i}>
            <strong>{entry.action}</strong>
            <div className="muted">
              {entry.by || 'Account'} ·{' '}
              {entry.date ? new Date(entry.date).toLocaleString() : ''}
            </div>
            {entry.reason && <div style={{ marginTop: 4 }}>{entry.reason}</div>}
          </div>
        ))}
        {role === 'Proctor' && selected.status === 'Submitted' && (
          <div className="form-actions">
            <button
              className="btn"
              disabled={busy}
              onClick={() => decideRequest(selected, 'Approved')}
            >
              Approve
            </button>
            <button
              className="btn danger"
              disabled={busy}
              onClick={() => decideRequest(selected, 'Cancelled')}
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    );
  }

  function overviewPage() {
    return (
      <>
        <section className="stats">
          <div className="stat">
            <div className="stat-label">Visible Requests</div>
            <div className="number">{visibleRequests.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Approved</div>
            <div className="number">{approved}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Submitted / Pending</div>
            <div className="number">{pending}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Cancelled</div>
            <div className="number">{cancelled}</div>
          </div>
        </section>

        {role === 'Proctor' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Students in {proctorGroup || 'your assigned group'}</h2>
                <div className="muted">
                  Registered student accounts assigned to your group.
                </div>
              </div>
              <span className="badge">
                {registeredStudents.length} students
              </span>
            </div>
            {!proctorGroup ? (
              <div className="alert warning">
                Your proctor profile has no assigned group. Ask an administrator
                to assign one.
              </div>
            ) : !registeredStudents.length ? (
              <div className="empty">
                No students found for this group. Check student group
                assignments and profile access policies.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll Number</th>
                      <th>Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.full_name || 'Unnamed student'}</strong>
                        </td>
                        <td>{s.roll_number || '—'}</td>
                        <td>{s.group_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <div className="grid">
          <section className="panel">
            <div className="panel-head">
              <h2>
                {role === 'Proctor'
                  ? 'Recent Group Requests'
                  : role === 'Student'
                  ? 'My Recent Requests'
                  : 'Recent Requests'}
              </h2>
              <button
                className="btn secondary small"
                onClick={() =>
                  setPage(
                    role === 'Proctor'
                      ? 'Group Requests'
                      : role === 'Student'
                      ? 'My Requests'
                      : 'All Requests'
                  )
                }
              >
                View Requests
              </button>
            </div>
            {!visibleRequests.length ? (
              <div className="empty">No requests to display yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Student</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRequests.slice(0, 5).map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.title}</strong>
                          <div className="muted">{r.id}</div>
                        </td>
                        <td>
                          {r.student}
                          <div className="muted">{r.roll}</div>
                        </td>
                        <td>{statusBadge(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Quick Actions</h2>
            </div>
            {role === 'Student' ? (
              <>
                <p className="muted">
                  Submit a technical-event participation request for proctor
                  review.
                </p>
                <button className="btn" onClick={openNewRequest}>
                  + New Event Request
                </button>
              </>
            ) : role === 'Proctor' ? (
              <>
                <p className="muted">
                  Review submitted requests from your assigned group and record
                  a decision.
                </p>
                <button
                  className="btn"
                  onClick={() => setPage('Group Requests')}
                >
                  Review Group Requests
                </button>
              </>
            ) : (
              <p className="muted">Review requests visible to your account.</p>
            )}
            <div className="alert warning" style={{ marginTop: 16 }}>
              Attendance and CSV import are not connected to database storage in
              this version. No sample attendance values are shown.
            </div>
          </section>
        </div>
      </>
    );
  }

  function studentsPage() {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Assigned Students</h2>
            <div className="muted">Group: {proctorGroup || 'Not assigned'}</div>
          </div>
          <button
            className="btn ghost"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
        {!proctorGroup ? (
          <div className="alert warning">
            No group is assigned to this proctor account.
          </div>
        ) : !registeredStudents.length ? (
          <div className="empty">
            No students are assigned to this group, or the profile RLS policy is
            not configured.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Group</th>
                </tr>
              </thead>
              <tbody>
                {registeredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.full_name || 'Unnamed student'}</strong>
                    </td>
                    <td>{s.roll_number || '—'}</td>
                    <td>{s.group_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            Tech<span>Permit</span>
          </div>
          <div className="subbrand">TECHNICAL EVENT APPROVAL PORTAL</div>
          <div className="label">SIGNED-IN ACCOUNT</div>
          <div className="role" style={{ overflowWrap: 'anywhere' }}>
            <strong>{studentName}</strong>
            <div style={{ fontSize: 11, marginTop: 5 }}>{role}</div>
            {studentRoll && (
              <div style={{ fontSize: 11, marginTop: 4 }}>{studentRoll}</div>
            )}
            {role === 'Proctor' && (
              <div style={{ fontSize: 11, marginTop: 4 }}>
                Assigned group: {proctorGroup || 'Not assigned'}
              </div>
            )}
          </div>
          <nav className="nav">
            {nav.map((item) => (
              <button
                key={item}
                className={page === item ? 'active' : ''}
                onClick={() => {
                  setPage(item);
                  setNotice(null);
                }}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="note">
            Account access is controlled by your signed-in profile and database
            permissions.
          </div>
        </aside>

        <main className="main">
          <header className="top">
            <div>
              <h1>{page}</h1>
              <div className="muted">
                Technical Event Participation Approval & Attendance Monitoring
              </div>
            </div>
            <div className="pill">
              {role}
              {role === 'Student'
                ? ` · ${studentName}`
                : role === 'Proctor'
                ? ` · ${proctorGroup || 'No group assigned'}`
                : ''}
            </div>
          </header>

          {notice && (
            <div
              className={`alert ${
                notice.type === 'success'
                  ? 'success'
                  : notice.type === 'error'
                  ? 'error'
                  : notice.type === 'warning'
                  ? 'warning'
                  : ''
              }`}
              role="status"
            >
              {notice.text}
            </div>
          )}

          {page === 'Overview' && overviewPage()}
          {['My Requests', 'Group Requests', 'All Requests'].includes(page) &&
            requestsPage()}
          {page === 'New Event Request' && role === 'Student' && requestForm()}
          {page === 'Request Details' && detailsPage()}
          {page === 'Students' && role === 'Proctor' && studentsPage()}

          <div
            className="muted"
            style={{ textAlign: 'center', padding: '14px 0 4px' }}
          >
            TechPermit · Connected to your authenticated account
          </div>
        </main>
      </div>
    </>
  );
}
