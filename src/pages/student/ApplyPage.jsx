import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { applicationsApi } from "../../api/api";
import "../../styles/apply.css";

const STEPS = [
  { id: 1, label: "Basic Info", icon: "◈" },
  { id: 2, label: "Qualification", icon: "◎" },
  { id: 3, label: "Attachments", icon: "⊕" },
];

const initialForm = {
  phone: "", address: "", district: "", state: "", country: "",
  pin: "", gender: "Male", nationality: "", sourceOfFinance: "", coverLetter: "",
  qual10Board: "", qual10Year: "", qual10Subjects: "", qual10Percent: "",
  qual12Board: "", qual12Year: "", qual12Subjects: "", qual12Percent: "",
  qualUGBoard: "", qualUGYear: "", qualUGSubjects: "", qualUGPercent: "",
  qualPGBoard: "", qualPGYear: "", qualPGSubjects: "", qualPGPercent: "",
  otherInfo: "", resume: null,
};

export default function ApplyPage() {
  const { internshipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const internship = location.state || {};

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resumeName, setResumeName] = useState("");

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.phone) return "Mobile number is required.";
      if (!form.address) return "Address is required.";
      if (!form.nationality) return "Nationality is required.";
    }
    if (step === 2) {
      if (!form.qual10Board || !form.qual10Year || !form.qual10Percent)
        return "Please fill in at least your 10th qualification details.";
    }
    if (step === 3) {
      if (!form.resume) return "Please upload your resume (PDF).";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => { setError(""); setStep((s) => s - 1); window.scrollTo(0, 0); };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);

    try {
      // Build FormData — matches ApplyFormDto exactly
      const fd = new FormData();
      // PascalCase keys must match C# property names exactly
      fd.append("Phone", form.phone);
      fd.append("Address", form.address);
      fd.append("District", form.district || "");
      fd.append("State", form.state || "");
      fd.append("Country", form.country || "");
      fd.append("Pin", form.pin || "");
      fd.append("Gender", form.gender);
      fd.append("Nationality", form.nationality);
      fd.append("SourceOfFinance", form.sourceOfFinance || "");
      fd.append("CoverLetter", form.coverLetter || "");

      fd.append("Qual10Board", form.qual10Board || "");
      fd.append("Qual10Year", form.qual10Year || "");
      fd.append("Qual10Subjects", form.qual10Subjects || "");
      fd.append("Qual10Percent", form.qual10Percent || "");

      fd.append("Qual12Board", form.qual12Board || "");
      fd.append("Qual12Year", form.qual12Year || "");
      fd.append("Qual12Subjects", form.qual12Subjects || "");
      fd.append("Qual12Percent", form.qual12Percent || "");

      fd.append("QualUGBoard", form.qualUGBoard || "");
      fd.append("QualUGYear", form.qualUGYear || "");
      fd.append("QualUGSubjects", form.qualUGSubjects || "");
      fd.append("QualUGPercent", form.qualUGPercent || "");

      fd.append("QualPGBoard", form.qualPGBoard || "");
      fd.append("QualPGYear", form.qualPGYear || "");
      fd.append("QualPGSubjects", form.qualPGSubjects || "");
      fd.append("QualPGPercent", form.qualPGPercent || "");

      fd.append("OtherInfo", form.otherInfo || "");

      if (form.resume) fd.append("Resume", form.resume);

      await applicationsApi.apply(internshipId, fd);
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Application failed. You may have already applied.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="apply-page">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2>Application Submitted!</h2>
          <p>Your application for <strong>{internship.role}</strong> at <strong>{internship.company}</strong> has been submitted successfully.</p>
          <p className="success-sub">You can track the status in <em>My Applications</em>.</p>
          <button className="btn-primary" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>← Back</button>
        <div className="apply-title">
          <span className="apply-company">{internship.company || "Internship"}</span>
          <h1>{internship.role || "Application Form"}</h1>
        </div>
      </div>

      <div className="step-tracker">
        {STEPS.map((s, i) => (
          <div key={s.id} className="step-item">
            <div className={`step-circle ${step === s.id ? "active" : step > s.id ? "done" : ""}`}>
              {step > s.id ? "✓" : s.icon}
            </div>
            <div className={`step-label ${step === s.id ? "active" : ""}`}>{s.label}</div>
            {i < STEPS.length - 1 && <div className={`step-line ${step > s.id ? "done" : ""}`} />}
          </div>
        ))}
      </div>

      <div className="form-card">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="form-step">
            <div className="step-heading">
              <span className="step-num">Step 1 / 3</span>
              <h2>Personal Details</h2>
              <p>Basic contact and personal information</p>
            </div>
            <div className="form-grid-2">
              <div className="field">
                <label>Gender <span className="req">*</span></label>
                <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option>Male</option><option>Female</option>
                  <option>Other</option><option>Prefer not to say</option>
                </select>
              </div>
              <div className="field">
                <label>Nationality <span className="req">*</span></label>
                <input placeholder="e.g. Indian" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Mobile Number <span className="req">*</span></label>
              <input type="tel" placeholder="10-digit number" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field">
              <label>Address <span className="req">*</span></label>
              <textarea rows={3} placeholder="Street / Area / Locality" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="form-grid-2">
              <div className="field"><label>District</label><input placeholder="District" value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
              <div className="field"><label>State</label><input placeholder="State" value={form.state} onChange={(e) => set("state", e.target.value)} /></div>
              <div className="field"><label>Country</label><input placeholder="Country" value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
              <div className="field"><label>PIN Code</label><input placeholder="PIN / ZIP" maxLength={10} value={form.pin} onChange={(e) => set("pin", e.target.value)} /></div>
            </div>
            <div className="field">
              <label>Source of Finance (if any)</label>
              <input placeholder="Organisation name or NIL" value={form.sourceOfFinance} onChange={(e) => set("sourceOfFinance", e.target.value)} />
            </div>
            <div className="field">
              <label>Cover Letter / Motivation</label>
              <textarea rows={4} placeholder="Why are you interested in this internship? (optional)" value={form.coverLetter} onChange={(e) => set("coverLetter", e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="form-step">
            <div className="step-heading">
              <span className="step-num">Step 2 / 3</span>
              <h2>Educational Qualification</h2>
              <p>Starting from 10th onwards up to last degree obtained</p>
            </div>
            {[
              { key: "10", label: "10th / SSC / HSC", required: true },
              { key: "12", label: "+2 / Intermediate / Equivalent", required: false },
              { key: "UG", label: "Undergraduate (UG)", required: false },
              { key: "PG", label: "Postgraduate (PG)", required: false },
            ].map(({ key, label, required }) => (
              <div key={key} className="qual-block">
                <div className="qual-title">{label} {required && <span className="req">*</span>}</div>
                <div className="form-grid-4">
                  <div className="field"><label>Board / University</label><input placeholder="e.g. CBSE" value={form[`qual${key}Board`]} onChange={(e) => set(`qual${key}Board`, e.target.value)} /></div>
                  <div className="field"><label>Year of Passing</label><input placeholder="e.g. 2022" maxLength={4} value={form[`qual${key}Year`]} onChange={(e) => set(`qual${key}Year`, e.target.value)} /></div>
                  <div className="field"><label>Subjects / Specialization</label><input placeholder="e.g. Science" value={form[`qual${key}Subjects`]} onChange={(e) => set(`qual${key}Subjects`, e.target.value)} /></div>
                  <div className="field"><label>% / CGPA</label><input placeholder="e.g. 85% or 8.5" value={form[`qual${key}Percent`]} onChange={(e) => set(`qual${key}Percent`, e.target.value)} /></div>
                </div>
              </div>
            ))}
            <div className="field">
              <label>Any Other Information</label>
              <textarea rows={3} placeholder="Achievements, extra-curriculars..." value={form.otherInfo} onChange={(e) => set("otherInfo", e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="form-step">
            <div className="step-heading">
              <span className="step-num">Step 3 / 3</span>
              <h2>Attachments</h2>
              <p>Upload your resume to complete the application</p>
            </div>
            <div className="upload-zone">
              <div className="upload-icon">📄</div>
              <div className="upload-label">Resume / CV <span className="req">*</span></div>
              <p className="upload-hint">PDF format, max 2MB</p>
              <label className="upload-btn">
                {resumeName ? `✓ ${resumeName}` : "Browse File"}
                <input type="file" accept=".pdf" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) { set("resume", file); setResumeName(file.name); }
                  }}
                />
              </label>
            </div>
            <div className="review-box">
              <div className="review-title">Review Your Application</div>
              <div className="review-grid">
                <div className="review-item"><span className="review-key">Internship</span><span className="review-val">{internship.role} @ {internship.company}</span></div>
                <div className="review-item"><span className="review-key">Mobile</span><span className="review-val">{form.phone || "—"}</span></div>
                <div className="review-item"><span className="review-key">Nationality</span><span className="review-val">{form.nationality || "—"}</span></div>
                <div className="review-item"><span className="review-key">10th Board</span><span className="review-val">{form.qual10Board || "—"} {form.qual10Percent ? `(${form.qual10Percent})` : ""}</span></div>
                <div className="review-item"><span className="review-key">UG</span><span className="review-val">{form.qualUGBoard || "—"} {form.qualUGPercent ? `(${form.qualUGPercent})` : ""}</span></div>
                <div className="review-item"><span className="review-key">Resume</span><span className="review-val">{resumeName || "Not uploaded"}</span></div>
              </div>
            </div>
            <div className="declaration-box">
              <span className="decl-icon">⚠</span>
              <p>I hereby declare that all the information provided is true and correct to the best of my knowledge.</p>
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          {step > 1 && <button className="btn-back" onClick={handleBack}>← Previous</button>}
          <div style={{ flex: 1 }} />
          {step < 3
            ? <button className="btn-next" onClick={handleNext}>Save & Continue →</button>
            : <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application ✓"}
              </button>
          }
        </div>
      </div>
    </div>
  );
}