import { useState, useRef, useCallback, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
};

function renderSummary(summary) {
  if (!summary) return null;
  const parts = summary.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function formatSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

// Reusable drag-and-drop upload zone
function DropZone({ id, label, hint, accept, file, onFile, onClear, icon, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) onFile(droppedFile);
    },
    [onFile, disabled]
  );

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
            {icon}
          </div>
          <p className="text-sm font-medium text-slate-700">
            <span className="text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400">{hint}</p>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            disabled={disabled}
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="ml-3 shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Remove ${label}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const DocIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
    <path d="M14 2v6h6" strokeLinejoin="round" />
  </svg>
);

const PhotoIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ProfileGeneratorForm() {
  const [title, setTitle] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  // Job titles fetched from the backend, used to populate the dropdown.
  const [jobTitles, setJobTitles] = useState([]);
  const [loadingTitles, setLoadingTitles] = useState(true);
  const [titlesError, setTitlesError] = useState("");

  useEffect(() => {
    async function fetchJobTitles() {
      setLoadingTitles(true);
      setTitlesError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/Job-Description`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = Array.isArray(data.jobDescriptions) ? data.jobDescriptions : [];
        setJobTitles(list);
      } catch {
        setTitlesError("Couldn't load job titles — add one on the Job Descriptions page first.");
      } finally {
        setLoadingTitles(false);
      }
    }
    fetchJobTitles();
  }, []);

  function resetResult() {
    setStatus(STATUS.IDLE);
    setErrorMessage("");
    setResult(null);
  }

  function handleResumeFile(file) {
    if (file.type !== "application/pdf") {
      setErrorMessage("Resume must be a PDF file.");
      return;
    }
    setErrorMessage("");
    setResumeFile(file);
  }

  function handlePhotoFile(file) {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Photo must be an image file.");
      return;
    }
    setErrorMessage("");
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage("Enter the job title this profile is being generated for.");
      return;
    }
    if (!resumeFile) {
      setErrorMessage("Upload a resume PDF to continue.");
      return;
    }
    if (!photoFile) {
      setErrorMessage("Upload a candidate photo to continue.");
      return;
    }

    setStatus(STATUS.SUBMITTING);
    setErrorMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("resume", resumeFile);
    formData.append("photo", photoFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generateProfile`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Something went wrong generating the profile.");

      setResult({ downloadUrl: data.downloadUrl, profileData: data.profileData });
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setErrorMessage(err.message || "Network error — check the server is running.");
      setStatus(STATUS.ERROR);
    }
  }

  function handleStartOver() {
    setTitle("");
    setResumeFile(null);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    resetResult();
  }

  const isSubmitting = status === STATUS.SUBMITTING;
  const profile = result?.profileData;

  return (
    <div className={`mx-auto w-full px-6 pb-8 transition-all ${status === STATUS.SUCCESS ? "max-w-4xl" : "max-w-xl"}`}>
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Profile Generator</p>
          <h1 className="text-xl font-bold text-slate-900">Turn a resume into a bio slide</h1>
        </div>
      </div>

      {status !== STATUS.SUCCESS && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <p className="mb-5 text-sm text-slate-500">
            Match a candidate's resume against a stored job description and generate a polished,
            one-page profile deck automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="jobTitle" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Job title
                </label>
                <div className="relative">
                  <select
                    id="jobTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting || loadingTitles || jobTitles.length === 0}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-900 shadow-sm transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {loadingTitles ? "Loading job titles…" : "Select a job title"}
                    </option>
                    {jobTitles.map((jd) => (
                      <option key={jd._id || jd.title} value={jd.title}>
                        {jd.title}
                      </option>
                    ))}
                  </select>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {titlesError || "Pulled from the job descriptions you've saved."}
                </p>
              </div>

              <DropZone
                id="resume"
                label="Candidate resume (PDF)"
                hint="PDF up to 10MB"
                accept="application/pdf"
                file={resumeFile}
                onFile={handleResumeFile}
                onClear={() => setResumeFile(null)}
                icon={DocIcon}
                disabled={isSubmitting}
              />

              <DropZone
                id="photo"
                label="Candidate photo"
                hint="PNG or JPG — required, shown on the slide"
                accept="image/*"
                file={photoFile}
                onFile={handlePhotoFile}
                onClear={() => {
                  setPhotoFile(null);
                  setPhotoPreviewUrl(null);
                }}
                icon={PhotoIcon}
                disabled={isSubmitting}
              />

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {isSubmitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {isSubmitting ? "Generating profile…" : "Generate profile"}
              </button>

              {isSubmitting && (
                <p className="text-center text-xs text-slate-400">
                  Extracting the resume, matching it against the job description, and building the slide —
                  this usually takes a few seconds.
                </p>
              )}
            </form>
          </div>
        )}

        {status === STATUS.SUCCESS && profile && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-emerald-800">Profile generated successfully</p>
              </div>
              <a
                href={result.downloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download PowerPoint
              </a>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-8">
                <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {profile.headerLabel || "Candidate Profile"}
                </p>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt={profile.name}
                      className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-indigo-50"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-400 ring-4 ring-slate-50">
                      No photo
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                    <p className="font-medium text-indigo-600">{profile.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{renderSummary(profile.summary)}</p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-sm font-bold text-slate-900">Relevant Tools / Skills</h4>
                    <div className="space-y-2">
                      {(profile.skills || []).map((s, i) => (
                        <div key={i} className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{s.label}</span>
                          <p className="mt-0.5 flex flex-wrap gap-1.5">
                            {s.value.split(",").map((v, j) => (
                              <span
                                key={j}
                                className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                              >
                                {v.trim()}
                              </span>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>

                    <h4 className="mb-3 mt-6 text-sm font-bold text-slate-900">Industry Sector Experience</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.industries || []).map((ind, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-bold text-slate-900">Relevant Experience</h4>
                    <ul className="space-y-2.5">
                      {(profile.experienceBullets || []).map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartOver}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Generate another profile
            </button>
          </div>
        )}
    </div>
  );
}