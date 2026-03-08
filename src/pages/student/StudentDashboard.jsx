import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { internshipsApi, applicationsApi, usersApi, noticesApi, qaApi } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/dashboard.css";

const STATUS_LABELS = { 0:"Pending", 1:"Approved", 2:"Rejected" };
function normalizeStatus(s) { return typeof s==="number" ? STATUS_LABELS[s]??"Pending" : s; }

export default function StudentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("internships");
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [qaInternship, setQaInternship] = useState(null);
  const [notices, setNotices] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3500); };

  useEffect(() => { document.body.classList.toggle("light-mode", !darkMode); }, [darkMode]);
  useEffect(() => { if(view==="notices") noticesApi.getAll().then(setNotices).catch(console.error); }, [view]);

  return (
    <div className="dashboard">
      {toast && <div className="toast">{toast}</div>}
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="brand-icon">◈</span><span>InternHub</span></div>
        <nav className="sidebar-nav">
          {[["internships","⊞","Internships"],["applications","◉","My Applications"],
            ["notices","📢","Notices"],["profile","⊙","Profile"]].map(([v,icon,label])=>(
            <button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>
              <span className="nav-icon">{icon}</span> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={()=>setDarkMode(d=>!d)}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button className="sidebar-logout" onClick={async () => {try { await authApi.logout(); } catch {}logout();navigate("/login");}}>← Logout</button>
        </div>
      </aside>
      <main className="main-content">
        {view==="internships"   && <InternshipsView navigate={navigate} showToast={showToast} qaInternship={qaInternship} setQaInternship={setQaInternship} />}
        {view==="applications"  && <ApplicationsView showToast={showToast} />}
        {view==="notices"       && <NoticesView notices={notices} />}
        {view==="profile"       && <ProfileView showToast={showToast} />}
      </main>
    </div>
  );
}

// ── INTERNSHIPS VIEW ──────────────────────────────────
function InternshipsView({ navigate, showToast, qaInternship, setQaInternship }) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 6;

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const data = await internshipsApi.getAll({ search, page, pageSize });
      setInternships(data.items || []);
      setTotalPages(Math.ceil((data.totalCount || 0) / pageSize));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInternships(); }, [search, page]);

  const isPastDeadline = (deadline) => deadline && new Date(deadline) < new Date();

  if (qaInternship) {
    return <QAPanel internship={qaInternship} onBack={() => setQaInternship(null)} showToast={showToast} />;
  }

  return (
    <div className="view-section">
      <div className="view-header"><h2>Internships</h2><p>Browse and apply for internship opportunities</p></div>
      <div className="search-bar">
        <input placeholder="🔍 Search company or role..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} />
      </div>
      {loading ? (
        <div className="internship-grid">{[...Array(6)].map((_,i)=><div key={i} className="card-skeleton"/>)}</div>
      ) : (
        <div className="internship-grid">
          {internships.map(i=>{
            const deadlinePassed = isPastDeadline(i.deadline);
            return (
              <div key={i.id} className={`internship-card ${deadlinePassed?"card-expired":""}`}>
                <div className="card-company">{i.company}</div>
                <div className="card-role">{i.role}</div>
                <div className="card-desc">{i.description}</div>
                <div className="card-meta">
                  {i.location && <span className="meta-pill">{i.location}</span>}
                  {i.stipend  && <span className="meta-pill">{i.stipend}</span>}
                  {i.deadline && <span className={`meta-pill ${deadlinePassed?"pill-expired":"pill-deadline"}`}>
                    {deadlinePassed ? "⛔ Deadline passed" : `⏰ Due ${new Date(i.deadline).toLocaleDateString()}`}
                  </span>}
                </div>
                <div className="card-actions">
                  <button
                    className="btn-apply"
                    disabled={deadlinePassed}
                    onClick={()=>navigate(`/apply/${i.id}`,{state:i})}
                  >
                    {deadlinePassed ? "Closed" : "Apply →"}
                  </button>
                  <button className="btn-qa" onClick={()=>setQaInternship(i)}>
                    💬 Q&A
                  </button>
                </div>
              </div>
            );
          })}
          {internships.length===0 && <p className="empty-state">No internships found.</p>}
        </div>
      )}
      {totalPages>1 && (
        <div className="pagination">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Q&A PANEL ─────────────────────────────────────────
function QAPanel({ internship, onBack, showToast }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const userEmail = localStorage.getItem("email");

  const fetchQA = async () => {
    try {
      const data = await qaApi.getQuestions(internship.id);
      setQuestions(data);
    } catch { showToast("Failed to load Q&A"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQA(); }, [internship.id]);

  const handlePostQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    try {
      const q = await qaApi.postQuestion(internship.id, newQuestion.trim());
      setQuestions(prev => [q, ...prev]);
      setNewQuestion("");
      showToast("Question posted! ✓");
    } catch(e) { showToast(e.message || "Failed to post question"); }
    finally { setSubmitting(false); }
  };

  const handlePostAnswer = async (questionId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const a = await qaApi.postAnswer(internship.id, questionId, replyText.trim());
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, answers: [...q.answers, a] } : q
      ));
      setReplyingTo(null);
      setReplyText("");
      showToast("Answer posted! ✓");
    } catch(e) { showToast(e.message || "Failed to post answer"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="view-section">
      <button className="btn-back-qa" onClick={onBack}>← Back to Internships</button>
      <div className="qa-header">
        <div>
          <h2>Q&A — {internship.role}</h2>
          <p className="qa-company">{internship.company}</p>
        </div>
        <span className="qa-count">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Ask a question */}
      <div className="qa-ask-box">
        <div className="qa-ask-title">Ask a Question</div>
        <textarea
          rows={3}
          placeholder="Ask anything about this internship — role, eligibility, process..."
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          className="qa-textarea"
        />
        <button className="btn-post-question" onClick={handlePostQuestion} disabled={submitting || !newQuestion.trim()}>
          {submitting ? "Posting..." : "Post Question →"}
        </button>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="loading-list">{[...Array(3)].map((_,i) => <div key={i} className="row-skeleton" />)}</div>
      ) : questions.length === 0 ? (
        <div className="qa-empty">No questions yet. Be the first to ask!</div>
      ) : (
        <div className="qa-list">
          {questions.map(q => (
            <div key={q.id} className="qa-card">
              {/* Question */}
              <div className="qa-question-row">
                <div className="qa-avatar">{q.askedBy?.[0]?.toUpperCase()}</div>
                <div className="qa-question-body">
                  <div className="qa-meta">
                    <span className="qa-author">{q.askedBy}</span>
                    {q.askedByAdmin && <span className="qa-admin-badge">Admin</span>}
                    <span className="qa-time">{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="qa-text">{q.body}</div>
                </div>
              </div>

              {/* Answers */}
              {q.answers.length > 0 && (
                <div className="qa-answers">
                  {q.answers.map(a => (
                    <div key={a.id} className={`qa-answer-row ${a.isAdminReply ? "admin-answer" : ""}`}>
                      <div className={`qa-avatar qa-avatar-sm ${a.isAdminReply ? "qa-avatar-admin" : ""}`}>
                        {a.answeredBy?.[0]?.toUpperCase()}
                      </div>
                      <div className="qa-answer-body">
                        <div className="qa-meta">
                          <span className="qa-author">{a.answeredBy}</span>
                          {a.isAdminReply && <span className="qa-admin-badge">Admin</span>}
                          <span className="qa-time">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="qa-text">{a.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              {replyingTo === q.id ? (
                <div className="qa-reply-box">
                  <textarea
                    rows={2}
                    placeholder="Write your answer..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="qa-textarea qa-textarea-sm"
                    autoFocus
                  />
                  <div className="qa-reply-actions">
                    <button className="btn-post-answer" onClick={() => handlePostAnswer(q.id)} disabled={submitting || !replyText.trim()}>
                      Post Answer
                    </button>
                    <button className="btn-cancel-reply" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-reply" onClick={() => { setReplyingTo(q.id); setReplyText(""); }}>
                  Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MY APPLICATIONS VIEW ──────────────────────────────
function ApplicationsView({ showToast }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await applicationsApi.getMyApplications();
      setApplications(data.map(a=>({...a,status:normalizeStatus(a.status)})));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchApps(); },[]);

  const handleWithdraw = async (id) => {
    if (!window.confirm("Withdraw this application? This cannot be undone.")) return;
    try {
      await applicationsApi.withdraw(id);
      setApplications(prev=>prev.filter(a=>a.id!==id));
      showToast("Application withdrawn successfully.");
    } catch(e) { showToast(e.message || "Failed to withdraw"); }
  };

  const statusColor = (s) => s==="Approved"?"status-approved":s==="Rejected"?"status-rejected":"status-pending";

  return (
    <div className="view-section">
      <div className="view-header"><h2>My Applications</h2><p>Track your application statuses</p></div>
      {loading ? <div className="loading-list">{[...Array(4)].map((_,i)=><div key={i} className="row-skeleton"/>)}</div>
        : applications.length===0 ? <div className="empty-state"><p>You haven't applied to any internships yet.</p></div>
        : (
          <div className="application-list">
            {applications.map(app=>(
              <div key={app.id} className="app-card">
                <div className="app-card-info">
                  <div className="app-role">{app.internship.role}</div>
                  <div className="app-company">{app.internship.company}</div>
                  <div className="app-date">Applied {new Date(app.appliedOn).toLocaleDateString()}</div>
                </div>
                <div className="app-card-right">
                  <span className={`status-badge ${statusColor(app.status)}`}>{app.status}</span>
                  {app.status==="Pending" && (
                    <button className="btn-withdraw" onClick={()=>handleWithdraw(app.id)}>Withdraw</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── NOTICES VIEW ──────────────────────────────────────
function NoticesView({ notices }) {
  return (
    <div className="view-section">
      <div className="view-header"><h2>Notices</h2><p>Important announcements from admin</p></div>
      {notices.length===0 ? <div className="empty-state"><p>No notices at the moment.</p></div>
        : (
          <div className="notices-list">
            {notices.map(n=>(
              <div key={n.id} className="notice-item">
                <div className="notice-dot">📢</div>
                <div className="notice-content">
                  <div className="notice-item-title">{n.title}</div>
                  <div className="notice-item-body">{n.body}</div>
                  <div className="notice-item-meta">Posted by {n.postedBy} · {new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── PROFILE VIEW — with photo upload ─────────────────
function ProfileView({ showToast }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    usersApi.getMe().then(p=>{ setProfile(p); setName(p.name); }).catch(console.error);
    usersApi.getMyStats().then(setStats).catch(console.error);
    usersApi.fetchPhoto().then(url=>{ if(url) setPhotoUrl(url); }).catch(()=>{});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await usersApi.updateMe({ name }); showToast("Profile updated! ✓"); }
    catch { showToast("Update failed"); }
    finally { setSaving(false); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("photo", file);
      await usersApi.uploadPhoto(fd);
      const url = await usersApi.fetchPhoto();
      if (url) setPhotoUrl(url);
      showToast("Photo updated! ✓");
    } catch(e) { showToast(e.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  if (!profile) return <div className="view-section"><div className="row-skeleton"/></div>;

  return (
    <div className="view-section">
      <div className="view-header"><h2>Profile</h2><p>Manage your account</p></div>
      <div className="profile-layout">
        <div className="profile-photo-section">
          <div className="profile-photo-wrap" onClick={()=>fileRef.current.click()}>
            {photoUrl
              ? <img src={photoUrl} alt="Profile" className="profile-photo" />
              : <div className="profile-photo-placeholder">{profile.name?.[0]?.toUpperCase()}</div>
            }
            <div className="photo-overlay">{uploading ? "Uploading..." : "📷 Change"}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoChange} />
          <p className="photo-hint">JPG, PNG or WEBP · Max 2MB</p>
        </div>

        <div className="profile-form-section">
          <div className="field">
            <label>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={profile.email} disabled style={{opacity:0.5}} />
          </div>
          <div className="field">
            <label>Role</label>
            <input value={profile.role} disabled style={{opacity:0.5}} />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid" style={{marginTop:32}}>
          <div className="stat-card"><div className="stat-number">{stats.totalApplied}</div><div className="stat-label">Applied</div></div>
          <div className="stat-card stat-pending"><div className="stat-number">{stats.pending}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card stat-approved"><div className="stat-number">{stats.approved}</div><div className="stat-label">Approved</div></div>
          <div className="stat-card stat-rejected"><div className="stat-number">{stats.rejected}</div><div className="stat-label">Rejected</div></div>
        </div>
      )}
    </div>
  );
}
