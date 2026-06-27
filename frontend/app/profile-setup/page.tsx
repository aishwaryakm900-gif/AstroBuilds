"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2, AlertCircle, CheckCircle, ShieldAlert, Award, Briefcase, Phone, MapPin, FileText } from "lucide-react";
import { getErrorMessage } from "@/utils/error";


export default function ProfileSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [license, setLicense] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Prefill if profile already exists
    if (parsedUser.profile) {
      setPhone(parsedUser.profile.phone || "");
      setCompany(parsedUser.profile.company || "");
      setExperience(parsedUser.profile.experience_years?.toString() || "");
      setLicense(parsedUser.profile.license_number || "");
      setAddress(parsedUser.profile.address || "");
      setBio(parsedUser.profile.bio || "");
      setSkills(parsedUser.profile.skills || "");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const profileData = {
        phone: phone || null,
        company: company || null,
        experience_years: experience ? parseInt(experience, 10) : null,
        license_number: license || null,
        address: address || null,
        bio: bio || null,
        skills: skills || null,
        first_time_login: false // Marks profile setup complete
      };

      const response = await fetch("http://localhost:8000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(getErrorMessage(errData, "Failed to update profile"));
      }


      const updatedProfile = await response.json();
      
      // Update local storage user object
      if (user) {
        const updatedUser = { ...user, profile: updatedProfile };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/project-select");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isContractorOrEngineer = ["Contractor", "Site Engineer"].includes(user.role);
  const isHomeowner = user.role === "Project Owner";

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl w-full space-y-8 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-tr from-orange-500 to-amber-600 p-3 rounded-2xl text-white shadow-xl shadow-orange-500/10">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            Welcome to AstroBuilds AI
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Please complete your digital work profile to configure the construction neural engine for your specific system role: <span className="text-orange-400 font-bold uppercase">{user.role}</span>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-2 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold">
              <CheckCircle className="h-5 w-5 text-green-400 animate-pulse" />
              <span>Profile initialized successfully! Directing to workspace selection...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <Phone className="h-3.5 w-3.5 text-orange-500" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                />
              </div>

              {/* Company / Organisation */}
              {!isHomeowner && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-orange-500" />
                    <span>Company / Organisation</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Titan Construction Group"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                  />
                </div>
              )}
            </div>

            {isContractorOrEngineer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience Years */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                    <Award className="h-3.5 w-3.5 text-orange-500" />
                    <span>Years of Experience</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="8"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                  />
                </div>

                {/* License Registration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    <span>License / Registration ID</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="LIC-IN-2026-908"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {isHomeowner && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  <span>Current Residential Address</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 45, Golden Heights, Bandra West, Mumbai"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                />
              </div>
            )}

            {isContractorOrEngineer && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Skills & Specializations (Comma-separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Concrete Pouring, Structural Steel, Excavation Planning, Quality Control"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                />
              </div>
            )}

            {/* Profile Bio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Professional Bio / Introduction
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={isHomeowner ? "Describe your goals for this dream home construction..." : "A brief summary of your expertise and background..."}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/10 transition-all duration-200 border border-orange-500/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Initializing Digital Identity...</span>
                </>
              ) : (
                <span>Confirm Profile Identity</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
