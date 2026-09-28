import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

const STATUS = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
};

export default function JobDescriptionForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState("");

  // Recently added JDs, shown below the form so you can see what's already stored.
  const [savedJDs, setSavedJDs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  async function fetchJobDescriptions() {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Job-Description`);
      if (!res.ok) throw new Error("Failed to load job descriptions.");
      const data = await res.json();

      // Backend returns { jobDescriptions: [...] } — each item is a full
      // Mongoose doc with _id, title, description.
      setSavedJDs(Array.isArray(data.jobDescriptions) ? data.jobDescriptions : []);
    } catch (err) {
      console.error(err);
      setSavedJDs([]);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage("Enter a job title.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Paste the job description text.");
      return;
    }

    setStatus(STATUS.SUBMITTING);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/addJobDescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save the job description.");

      setStatus(STATUS.SUCCESS);
      setTitle("");
      setDescription("");
      fetchJobDescriptions(); // refresh the list
      setTimeout(() => setStatus(STATUS.IDLE), 2000);
    } catch (err) {
      setErrorMessage(err.message || "Network error — check the server is running.");
      setStatus(STATUS.ERROR);
    }
  }

  const isSubmitting = status === STATUS.SUBMITTING;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-8 ">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Job Descriptions</p>
        <h1 className="text-2xl font-bold text-slate-900">Add a new job description</h1>
        <p className="mt-1 text-sm text-slate-500">
          Saved job titles become available in the dropdown on the Generate Profile page.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="jdTitle" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Job title
            </label>
            <input
              id="jdTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Node.js Backend Developer"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-shadow placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="jdDescription" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Job description
            </label>
            <textarea
              id="jdDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job description text here..."
              rows={10}
              disabled={isSubmitting}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-shadow placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              {errorMessage}
            </div>
          )}

          {status === STATUS.SUCCESS && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Job description saved.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {isSubmitting ? "Saving…" : "Save job description"}
          </button>
        </form>
      </div>

      {/* --- Saved JDs list --- */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Saved job descriptions</h2>
        {loadingList ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : savedJDs.length === 0 ? (
          <p className="text-sm text-slate-400">No job descriptions saved yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {savedJDs.map((jd) => (
              <div key={jd._id || jd.title} className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{jd.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{jd.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}