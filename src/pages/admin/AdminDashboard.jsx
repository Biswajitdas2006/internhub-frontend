import { useState, useEffect } from "react";
import { authApi, applicationsApi, internshipsApi, internshipsAdminApi, noticesApi, analyticsApi, exportApi, qaApi } from "../../api/api";import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import "../../styles/dashboard.css";
import "../../styles/admin.css";

const BASE_URL = "/api";
const STATUS_LABELS = { 0: "Pending", 1: "Approved", 2: "Rejected" };
function normalizeStatus(s) { return typeof s === "number" ? STATUS_LABELS[s] ?? "Pending" : s; }
async function openResume(applicationId, filename, download = false) {
  const res = await fetch(`${BASE_URL}/applications/${applicationId}/resume`, {credentials: "include"});
  if (!res.ok) { alert("Failed to load resume."); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (download) { const a = document.createElement("a"); a.href = url; a.download = filename || "resume.pdf"; a.click(); }
  else window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("applications");
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);  // ← ADD

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  useEffect(() => {
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  const handleNav = (v) => { setView(v); setSidebarOpen(false); };  // ← ADD

  return (
    <div className="dashboard">
      {toast && <div className="toast">{toast}</div>}

      {/* ── MOBILE HEADER ── */}
      <div className="mobile-header">
        <div className="mobile-brand">
          <span style={{color:"var(--accent)"}}>◈</span> InternHub
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)}>
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── OVERLAY ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand"><span className="brand-icon">◈</span><span>InternHub</span></div>
        <div className="admin-badge">Admin Panel</div>
        <nav className="sidebar-nav">
          {[
            ["applications","◉","Applications"],
            ["internships","⊞","Add Internship"],
            ["notices","📢","Notices"],
            ["analytics","📊","Analytics"],
            ["qa","💬","Q&A"],
          ].map(([v, icon, label]) => (
            <button key={v} className={view === v ? "active" : ""} onClick={() => handleNav(v)}>
              <span className="nav-icon">{icon}</span> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button className="sidebar-logout" onClick={async () => {
            try { await authApi.logout(); } catch {}
            logout(); navigate("/login");
          }}>← Logout</button>
        </div>
      </aside>

      <main className="main-content">
        {view === "applications" && <ApplicationsView showToast={showToast} />}
        {view === "internships"  && <AddInternshipView showToast={showToast} />}
        {view === "notices"      && <NoticesView showToast={showToast} />}
        {view === "analytics"    && <AnalyticsView showToast={showToast} />}
        {view === "qa"           && <AdminQAView showToast={showToast} />}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// APPLICATIONS VIEW — with search, filter, pagination, detail, message
// ══════════════════════════════════════════════════════
function ApplicationsView({ showToast }) {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailApp, setDetailApp] = useState(null);
  const [messageModal, setMessageModal] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (search) params.search = search;
      if (company) params.company = company;
      if (filter !== "All") params.status = filter;
      const data = await applicationsApi.getAll(params);
      setApplications((data.items || data).map(a => ({ ...a, status: normalizeStatus(a.status) })));
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); }, [filter, page, search, company]);

  const handleStatusUpdate = async (id, statusNum) => {
    setUpdatingId(id);
    try {
      await applicationsApi.updateStatus(id, statusNum, adminNote);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: STATUS_LABELS[statusNum] } : a));
      showToast(`Status updated & student notified by email! ✓`);
      setAdminNote("");
    } catch { showToast("Update failed"); }
    finally { setUpdatingId(null); }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      await applicationsApi.messageStudent(detailApp.applicationId, messageText);
      showToast("Message sent to student! ✓");
      setMessageText("");
    } catch (e) { showToast("Failed to send message: " + e.message); }
  };

  const handleViewDetail = async (id) => {
    try { const data = await applicationsApi.getDetail(id); setDetailApp(data); }
    catch { showToast("Failed to load details"); }
  };

  const statusColor = (s) => s === "Approved" ? "status-approved" : s === "Rejected" ? "status-rejected" : "status-pending";
  const totalPages = Math.ceil(total / pageSize);

  if (detailApp) return (
    <div className="view-section">
      <button className="btn-back-detail" onClick={() => setDetailApp(null)}>← Back to Applications</button>
      <h2 style={{margin:"0 0 24px"}}>Application Detail</h2>
      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-section-title">Student</div>
          {[["Name", detailApp.student?.name], ["Email", detailApp.student?.email],
            ["Phone", detailApp.phone], ["Gender", detailApp.gender],
            ["Nationality", detailApp.nationality], ["Address", detailApp.address],
            ["District", detailApp.district], ["State", detailApp.state], ["Country", detailApp.country]
          ].map(([k, v]) => v ? <div key={k} className="detail-row"><span>{k}</span><strong>{v}</strong></div> : null)}
          {detailApp.coverLetter && <div className="detail-row cover-letter"><span>Cover Letter</span><p>{detailApp.coverLetter}</p></div>}
        </div>
        <div className="detail-card">
          <div className="detail-section-title">Internship & Status</div>
          <div className="detail-row"><span>Role</span><strong>{detailApp.internship?.role}</strong></div>
          <div className="detail-row"><span>Company</span><strong>{detailApp.internship?.company}</strong></div>
          <div className="detail-row"><span>Applied</span><strong>{new Date(detailApp.appliedOn).toLocaleDateString()}</strong></div>
          <div className="detail-row"><span>Status</span><span className={`status-badge ${statusColor(detailApp.status)}`}>{detailApp.status}</span></div>

          <div className="detail-section-title" style={{marginTop:20}}>Qualifications</div>
          {[{l:"10th",b:detailApp.qual10Board,y:detailApp.qual10Year,p:detailApp.qual10Percent,s:detailApp.qual10Subjects},
            {l:"+2",b:detailApp.qual12Board,y:detailApp.qual12Year,p:detailApp.qual12Percent,s:detailApp.qual12Subjects},
            {l:"UG",b:detailApp.qualUGBoard,y:detailApp.qualUGYear,p:detailApp.qualUGPercent,s:detailApp.qualUGSubjects},
            {l:"PG",b:detailApp.qualPGBoard,y:detailApp.qualPGYear,p:detailApp.qualPGPercent,s:detailApp.qualPGSubjects},
          ].filter(q=>q.b).map(q=>(
            <div key={q.l} className="qual-row">
              <span className="qual-label">{q.l}</span>
              <span>{q.b} · {q.y} · {q.s} · <strong>{q.p}</strong></span>
            </div>
          ))}

          <div className="detail-section-title" style={{marginTop:20}}>Resume</div>
          {detailApp.resumeFileName ? (
            <div className="resume-actions">
              <button className="btn-resume-preview" onClick={() => openResume(detailApp.applicationId, detailApp.resumeFileName, false)}>👁 Preview</button>
              <button className="btn-resume-download" onClick={() => openResume(detailApp.applicationId, detailApp.resumeFileName, true)}>⬇ Download</button>
            </div>
          ) : <p style={{color:"#666d82",fontSize:"0.88rem"}}>No resume uploaded</p>}

          <div className="detail-section-title" style={{marginTop:20}}>Send Message</div>
          <div className="message-box">
            <textarea rows={3} placeholder="Write a message to this student..." value={messageText} onChange={e=>setMessageText(e.target.value)} />
            <button className="btn-send-msg" onClick={handleSendMessage} disabled={!messageText.trim()}>📧 Send Email</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="view-section">
      <div className="view-header">
        <div>
          <h2>All Applications</h2><p>Manage student applications</p>
        </div>
        <button className="btn-export" onClick={() => exportApi.downloadApplications().catch(()=>showToast("Export failed"))}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Search & Filter */}
      <div className="search-filter-row">
        <input className="search-input" placeholder="Search student name or email..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        <input className="search-input" placeholder="Filter by company..." value={company}
          onChange={e=>{setCompany(e.target.value);setPage(1);}} />
      </div>

      <div className="filter-tabs">
        {["All","Pending","Approved","Rejected"].map(f=>(
          <button key={f} className={filter===f?"tab-active":""} onClick={()=>{setFilter(f);setPage(1);}}>{f}</button>
        ))}
      </div>

      {loading ? <div className="loading-list">{[...Array(5)].map((_,i)=><div key={i} className="row-skeleton"/>)}</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Student</th><th>Email</th><th>Role</th><th>Company</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {applications.map(app=>(
                  <tr key={app.id}>
                    <td className="td-name">{app.student.name}</td>
                    <td className="td-email">{app.student.email}</td>
                    <td>{app.internship.role}</td>
                    <td>{app.internship.company}</td>
                    <td>{new Date(app.appliedOn).toLocaleDateString()}</td>
                    <td><span className={`status-badge ${statusColor(app.status)}`}>{app.status}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-approve" title="Approve" onClick={()=>handleStatusUpdate(app.id,1)} disabled={updatingId===app.id||app.status==="Approved"}>✓</button>
                        <button className="btn-reject" title="Reject" onClick={()=>handleStatusUpdate(app.id,2)} disabled={updatingId===app.id||app.status==="Rejected"}>✕</button>
                        <button className="btn-pending" title="Reset" onClick={()=>handleStatusUpdate(app.id,0)} disabled={updatingId===app.id||app.status==="Pending"}>↺</button>
                        <button className="btn-detail" title="View Details" onClick={()=>handleViewDetail(app.id)}>⊙</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length===0 && <tr><td colSpan="7" className="empty-row">No applications found</td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ADD INTERNSHIP VIEW — with edit
// ══════════════════════════════════════════════════════
function AddInternshipView({ showToast }) {
  const empty = { company:"", role:"", description:"", location:"Remote", stipend:"", startDate:"", endDate:"", deadline:"" };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [internships, setInternships] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Load ALL internships from DB on mount
  useEffect(() => {
    internshipsApi.getAll({ pageSize: 100 })
      .then(data => setInternships(data.items || []))
      .catch(() => showToast("Failed to load internships"))
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = {
        company: form.company,
        role: form.role,
        description: form.description,
        location: form.location,
        stipend: form.stipend,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null
      };
      if (editId) {
        await internshipsAdminApi.update(editId, payload);
        setInternships(p=>p.map(i=>i.id===editId?{...i,...payload,id:editId}:i));
        showToast("Internship updated! ✓"); setEditId(null);
      } else {
        const data = await internshipsAdminApi.create(payload);
        setInternships(p=>[data,...p]);
        showToast("Internship posted! ✓");
      }
      setForm(empty);
    } catch(e) { showToast("Failed: "+e.message); }
    finally { setLoading(false); }
  };

  const handleEdit = (i) => {
    setForm({ company:i.company, role:i.role, description:i.description,
      location:i.location||"Remote", stipend:i.stipend||"",
      startDate:i.startDate?i.startDate.slice(0,10):"",
      endDate:i.endDate?i.endDate.slice(0,10):"",
      deadline:i.deadline?i.deadline.slice(0,10):"" });
    setEditId(i.id);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this internship? This cannot be undone.")) return;
    try { await internshipsAdminApi.delete(id); setInternships(p=>p.filter(i=>i.id!==id)); showToast("Internship deleted"); }
    catch { showToast("Delete failed"); }
  };

  const isPastDeadline = (d) => d && new Date(d) < new Date();
  const filtered = internships.filter(i =>
    i.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-section">
      <div className="view-header">
        <div><h2>{editId ? "Edit Internship" : "Add Internship"}</h2><p>Post and manage internship opportunities</p></div>
      </div>
      <div className="two-col-layout">
        {/* ── LEFT: Form ── */}
        <div className="form-panel">
          <form onSubmit={handleSubmit} className="internship-form">
            <div className="field"><label>Company <span className="req">*</span></label>
              <input placeholder="e.g. Google" value={form.company} onChange={e=>set("company",e.target.value)} required /></div>
            <div className="field"><label>Role <span className="req">*</span></label>
              <input placeholder="e.g. Frontend Developer Intern" value={form.role} onChange={e=>set("role",e.target.value)} required /></div>
            <div className="field"><label>Description <span className="req">*</span></label>
              <textarea rows={4} placeholder="Describe responsibilities..." value={form.description} onChange={e=>set("description",e.target.value)} required /></div>
            <div className="form-row-2">
              <div className="field"><label>Location</label>
                <select value={form.location} onChange={e=>set("location",e.target.value)}>
                  <option>Remote</option><option>Onsite</option><option>Hybrid</option>
                </select></div>
              <div className="field"><label>Stipend</label>
                <input placeholder="e.g. ₹10,000/month" value={form.stipend} onChange={e=>set("stipend",e.target.value)} /></div>
            </div>
            <div className="form-row-2">
              <div className="field"><label>Start Date</label>
                <input type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} /></div>
              <div className="field"><label>End Date</label>
                <input type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)} /></div>
            </div>
            <div className="field"><label>Application Deadline</label>
              <input type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)} /></div>
            <div style={{display:"flex",gap:10}}>
              <button type="submit" className="btn-primary" disabled={loading} style={{flex:1}}>
                {loading ? "Saving..." : editId ? "Update Internship ✓" : "Post Internship →"}
              </button>
              {editId && <button type="button" className="btn-cancel-edit" onClick={()=>{setEditId(null);setForm(empty);}}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* ── RIGHT: All Internships List ── */}
        <div className="posted-list">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div className="posted-title" style={{margin:0}}>All Internships ({internships.length})</div>
          </div>
          <input
            className="search-input" style={{width:"100%",boxSizing:"border-box",marginBottom:12}}
            placeholder="Search by company or role..."
            value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
          />
          {fetching ? (
            <div className="row-skeleton"/>
          ) : filtered.length === 0 ? (
            <p className="empty-hint">{searchTerm ? "No results found" : "No internships posted yet"}</p>
          ) : (
            filtered.map(i => {
              const expired = isPastDeadline(i.deadline);
              return (
                <div key={i.id} className={`posted-card ${expired ? "card-expired-admin" : ""}`}>
                  <div className="posted-card-info">
                    <div className="posted-role">{i.role}</div>
                    <div className="posted-company">{i.company}</div>
                    <div className="posted-meta">
                      {i.location && <span className="meta-tag">{i.location}</span>}
                      {i.stipend  && <span className="meta-tag">{i.stipend}</span>}
                      {i.deadline && (
                        <span className={`meta-tag ${expired ? "deadline-tag" : ""}`}>
                          {expired ? "⛔ Deadline passed" : `⏰ Due ${new Date(i.deadline).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0,flexDirection:"column"}}>
                    <button className="btn-edit-text" onClick={()=>handleEdit(i)}>Update</button>
                    <button className="btn-delete-text" onClick={()=>handleDelete(i.id)}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// NOTICES VIEW
// ══════════════════════════════════════════════════════
function NoticesView({ showToast }) {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ title:"", body:"" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    noticesApi.getAll().then(setNotices).catch(console.error).finally(()=>setLoading(false));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault(); setSending(true);
    try {
      const data = await noticesApi.create(form);
      setNotices(n=>[data,...n]); setForm({title:"",body:""});
      showToast("Notice posted & emailed to all students! ✓");
    } catch(e) { showToast("Failed: "+e.message); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try { await noticesApi.delete(id); setNotices(n=>n.filter(x=>x.id!==id)); showToast("Notice removed"); }
    catch { showToast("Delete failed"); }
  };

  return (
    <div className="view-section">
      <div className="view-header"><h2>Notices</h2><p>Post announcements — emailed to all students</p></div>
      <div className="two-col-layout">
        <div className="form-panel">
          <form onSubmit={handlePost} className="internship-form">
            <div className="field"><label>Notice Title <span className="req">*</span></label>
              <input placeholder="e.g. Application Deadline Extended" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required /></div>
            <div className="field"><label>Message <span className="req">*</span></label>
              <textarea rows={6} placeholder="Write your notice here..." value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} required /></div>
            <div className="email-note"><span>📧</span> Emailed to all registered students automatically.</div>
            <button type="submit" className="btn-primary" disabled={sending}>{sending?"Sending...":"Post & Send Email →"}</button>
          </form>
        </div>
        <div className="posted-list">
          <div className="posted-title">Active Notices</div>
          {loading ? <div className="row-skeleton"/> : notices.length===0 ? <p className="empty-hint">No active notices</p>
            : notices.map(n=>(
            <div key={n.id} className="notice-card">
              <div className="notice-card-info">
                <div className="notice-title">{n.title}</div>
                <div className="notice-body">{n.body}</div>
                <div className="notice-meta">Posted by {n.postedBy} · {new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
              <button className="btn-delete-post" onClick={()=>handleDelete(n.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ANALYTICS VIEW
// ══════════════════════════════════════════════════════
function AnalyticsView({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.get().then(setData).catch(()=>showToast("Failed to load analytics")).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="view-section"><div className="loading-list">{[...Array(4)].map((_,i)=><div key={i} className="row-skeleton"/>)}</div></div>;
  if (!data) return <div className="view-section"><p>No data available.</p></div>;

  const PIE_COLORS = ["#c8f04d","#6ee7b7","#ff6b6b"];
  const pieData = [
    { name:"Pending",  value: data.statusBreakdown.pending  },
    { name:"Approved", value: data.statusBreakdown.approved },
    { name:"Rejected", value: data.statusBreakdown.rejected },
  ];

  return (
    <div className="view-section">
      <div className="view-header"><h2>Analytics</h2><p>Platform overview and insights</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{data.totalStudents}</div><div className="stat-label">Students</div></div>
        <div className="stat-card"><div className="stat-number">{data.totalInternships}</div><div className="stat-label">Internships</div></div>
        <div className="stat-card stat-approved"><div className="stat-number">{data.totalApplications}</div><div className="stat-label">Applications</div></div>
        <div className="stat-card stat-pending"><div className="stat-number">{data.approvalRate}%</div><div className="stat-label">Approval Rate</div></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Applications (Last 30 Days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.perDay}>
              <XAxis dataKey="date" tick={{fill:"#666d82",fontSize:11}} />
              <YAxis tick={{fill:"#666d82",fontSize:11}} />
              <Tooltip contentStyle={{background:"#14161d",border:"1px solid #2a2d3a",color:"#e2e8f0"}} />
              <Bar dataKey="count" fill="#c8f04d" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Status Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:"#14161d",border:"1px solid #2a2d3a",color:"#e2e8f0"}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card-full">
          <div className="chart-title">Top Companies by Applications</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topCompanies} layout="vertical">
              <XAxis type="number" tick={{fill:"#666d82",fontSize:11}} />
              <YAxis dataKey="company" type="category" width={120} tick={{fill:"#666d82",fontSize:11}} />
              <Tooltip contentStyle={{background:"#14161d",border:"1px solid #2a2d3a",color:"#e2e8f0"}} />
              <Bar dataKey="count" fill="#6ee7b7" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ADMIN Q&A VIEW — see all internships, pick one, answer questions
// ══════════════════════════════════════════════════════
function AdminQAView({ showToast }) {
  const [internships, setInternships] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    internshipsApi.getAll({ pageSize: 100 })
      .then(d => setInternships(d.items || []))
      .catch(() => showToast("Failed to load internships"));
  }, []);

  const handleSelect = async (i) => {
    setSelected(i);
    setLoadingQ(true);
    try {
      const data = await qaApi.getQuestions(i.id);
      setQuestions(data);
    } catch { showToast("Failed to load questions"); }
    finally { setLoadingQ(false); }
  };

  const handleAnswer = async (questionId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const a = await qaApi.postAnswer(selected.id, questionId, replyText.trim());
      setQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, answers: [...q.answers, a] } : q
      ));
      setReplyingTo(null); setReplyText("");
      showToast("Answer posted! ✓");
    } catch(e) { showToast(e.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await qaApi.deleteQuestion(selected.id, questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      showToast("Question deleted");
    } catch { showToast("Delete failed"); }
  };

  return (
    <div className="view-section">
      <div className="view-header"><h2>Q&A Management</h2><p>Answer student questions on internships</p></div>
      <div className="two-col-layout">
        {/* LEFT: internship picker */}
        <div className="form-panel" style={{maxHeight:600,overflowY:"auto"}}>
          <div className="posted-title">Select Internship</div>
          {internships.map(i => (
            <div key={i.id}
              className={`posted-card ${selected?.id === i.id ? "qa-selected" : ""}`}
              style={{cursor:"pointer"}}
              onClick={() => handleSelect(i)}
            >
              <div className="posted-card-info">
                <div className="posted-role">{i.role}</div>
                <div className="posted-company">{i.company}</div>
              </div>
              <span className="qa-arrow">{selected?.id === i.id ? "▶" : "›"}</span>
            </div>
          ))}
          {internships.length === 0 && <p className="empty-hint">No internships yet</p>}
        </div>

        {/* RIGHT: questions + answers */}
        <div className="posted-list" style={{maxHeight:600,overflowY:"auto"}}>
          {!selected ? (
            <p className="empty-hint">Select an internship to view its Q&A</p>
          ) : loadingQ ? (
            <div className="row-skeleton"/>
          ) : questions.length === 0 ? (
            <p className="empty-hint">No questions yet for this internship</p>
          ) : (
            questions.map(q => (
              <div key={q.id} className="qa-card-admin">
                <div className="qa-question-row">
                  <div className="qa-avatar">{q.askedBy?.[0]?.toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div className="qa-meta">
                      <span className="qa-author">{q.askedBy}</span>
                      <span className="qa-time">{new Date(q.createdAt).toLocaleDateString()}</span>
                      <button className="btn-delete-q" onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
                    </div>
                    <div className="qa-text">{q.body}</div>
                  </div>
                </div>

                {q.answers.map(a => (
                  <div key={a.id} className={`qa-answer-row ${a.isAdminReply ? "admin-answer" : ""}`}>
                    <div className={`qa-avatar qa-avatar-sm ${a.isAdminReply ? "qa-avatar-admin" : ""}`}>
                      {a.answeredBy?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="qa-meta">
                        <span className="qa-author">{a.answeredBy}</span>
                        {a.isAdminReply && <span className="qa-admin-badge">Admin</span>}
                      </div>
                      <div className="qa-text">{a.body}</div>
                    </div>
                  </div>
                ))}

                {replyingTo === q.id ? (
                  <div className="qa-reply-box">
                    <textarea rows={2} placeholder="Write your answer..." value={replyText}
                      onChange={e => setReplyText(e.target.value)} className="qa-textarea qa-textarea-sm" autoFocus />
                    <div className="qa-reply-actions">
                      <button className="btn-post-answer" onClick={() => handleAnswer(q.id)} disabled={submitting || !replyText.trim()}>Post Answer</button>
                      <button className="btn-cancel-reply" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-reply" onClick={() => { setReplyingTo(q.id); setReplyText(""); }}>Reply as Admin</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
