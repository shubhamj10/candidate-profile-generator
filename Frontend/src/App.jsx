import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ProfileGeneratorForm from "./components/ProfileGeneratorForm";
import JobDescriptionForm from "./components/JobDescriptionForm";


function Nav() {
  const linkBase =
    "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors";
  const active = "bg-indigo-600 text-white shadow-sm shadow-indigo-200";
  const inactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
 
  return (
    <nav className="mx-auto mb-4 flex w-full max-w-4xl items-center gap-2 px-6 pt-5">
      <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
        Generate Profile
      </NavLink>
      <NavLink to="/job-descriptions" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
        Job Descriptions
      </NavLink>
    </nav>
  );
}
 
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Nav />
        <Routes>
          <Route path="/" element={<ProfileGeneratorForm />} />
          <Route path="/job-descriptions" element={<JobDescriptionForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}