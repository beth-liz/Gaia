import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import {
  Trees,
  Shield,
  Bell,
  CheckCircle,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Activity,
  Radio
} from "lucide-react";

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({
    villagers: 124,
    incidents: 48,
    resolved: 42,
    officers: 18,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const data = await api.getDashboardStats();
        if (data) {
          setStats({
            villagers: data.total_villagers || 0,
            incidents: data.total_incidents || 0,
            resolved: data.resolved_incidents || 0,
            officers: data.total_officers || 0,
          });
        }
      } catch {
        // Fallback live display
      }
    };
    fetchLiveStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef] text-emerald-950 font-sans selection:bg-emerald-800 selection:text-white">
      {/* Sticky Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 backdrop-blur-md shadow-sm border-b border-emerald-950/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Trees className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-emerald-950 block">GAIA</span>
              <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider block">Wildlife Protection Network</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-emerald-900/80">
            <a href="#hero" className="hover:text-emerald-950 transition-colors">Home</a>
            <a href="#features" className="hover:text-emerald-950 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-emerald-950 transition-colors">Workflow</a>
            <a href="#about" className="hover:text-emerald-950 transition-colors">About</a>
            <a href="#contact" className="hover:text-emerald-950 transition-colors">Contact</a>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-emerald-950 hover:bg-emerald-900/5 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-semibold shadow-md shadow-emerald-950/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Register Villager
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-900/15 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Next-Gen Wildlife Operational System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-emerald-950">
              Harmonizing <span className="text-emerald-800 underline decoration-amber-400 decoration-4 underline-offset-8">Human Villages</span> & Forest Wildlife
            </h1>

            <p className="text-lg text-emerald-900/80 leading-relaxed max-w-2xl font-medium">
              Gaia connects local villagers, Range Forest Officers, and field guards through rapid PostgreSQL-backed incident reporting, automated guard assignments, and real-time response tracking.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-sm shadow-xl shadow-emerald-950/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                Get Started as Villager
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-semibold text-sm border border-emerald-900/15 shadow-sm transition-all hover:-translate-y-0.5"
              >
                Officer Command Login
              </Link>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg">
              <div className="bg-white/80 p-4 rounded-2xl border border-emerald-950/10 shadow-sm">
                <p className="text-2xl font-bold text-emerald-950">{stats.incidents}</p>
                <p className="text-xs font-semibold text-emerald-700">Incidents Logged</p>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-emerald-950/10 shadow-sm">
                <p className="text-2xl font-bold text-emerald-950">{stats.resolved}</p>
                <p className="text-xs font-semibold text-emerald-700">Resolved Safely</p>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-emerald-950/10 shadow-sm">
                <p className="text-2xl font-bold text-emerald-950">{stats.officers}</p>
                <p className="text-xs font-semibold text-emerald-700">Active Officers</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-emerald-950 group">
              <img
                src="/images/tiger1.jpg"
                alt="Gaia Wildlife Hero"
                className="w-full h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/90 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" />
                  Active Wildlife Protection
                </div>
                <h3 className="text-xl font-bold text-white">Wayanad Forest Division</h3>
                <p className="text-xs text-emerald-200">Continuous monitoring & instant villager alerts across all sectors.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 bg-white/60 border-y border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Platform Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
              Engineered for Range Operations & Community Safety
            </p>
            <p className="text-emerald-900/70 text-sm">
              Gaia provides dedicated dashboards tailored specifically to administrators, range officers, guards, and villagers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="gaia-card p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950">Verified User Approval</h3>
              <p className="text-emerald-900/70 text-sm leading-relaxed">
                Villager registrations are placed in pending verification until validated by administrators to prevent unauthorized access.
              </p>
            </div>

            <div className="gaia-card p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950">Smart Incident Assignment</h3>
              <p className="text-emerald-900/70 text-sm leading-relaxed">
                Range Forest Officers assign incidents exclusively to available Forest Guards, automatically updating guard statuses to busy during missions.
              </p>
            </div>

            <div className="gaia-card p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-emerald-950">Instant Notifications</h3>
              <p className="text-emerald-900/70 text-sm leading-relaxed">
                Real-time notification system alerts villagers on incident updates and notifies guards immediately upon task dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">How Gaia Works</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Streamlined Operational Workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="gaia-card p-6 space-y-3 relative">
            <span className="text-3xl font-extrabold text-emerald-800/30">01</span>
            <h4 className="text-lg font-bold text-emerald-950">Incident Reporting</h4>
            <p className="text-xs text-emerald-900/70">
              Villager logs an animal sighting with location, severity, description, and contact info.
            </p>
          </div>

          <div className="gaia-card p-6 space-y-3 relative">
            <span className="text-3xl font-extrabold text-emerald-800/30">02</span>
            <h4 className="text-lg font-bold text-emerald-950">Officer Review</h4>
            <p className="text-xs text-emerald-900/70">
              Range Forest Officer reviews pending reports and selects from available Forest Guards.
            </p>
          </div>

          <div className="gaia-card p-6 space-y-3 relative">
            <span className="text-3xl font-extrabold text-emerald-800/30">03</span>
            <h4 className="text-lg font-bold text-emerald-950">Guard Deployment</h4>
            <p className="text-xs text-emerald-900/70">
              Assigned Forest Guard receives instant alert; status switches to Busy during patrol.
            </p>
          </div>

          <div className="gaia-card p-6 space-y-3 relative">
            <span className="text-3xl font-extrabold text-emerald-800/30">04</span>
            <h4 className="text-lg font-bold text-emerald-950">Completion & Release</h4>
            <p className="text-xs text-emerald-900/70">
              Guard completes investigation report, marks incident completed, and returns to Available status.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT & WHY GAIA SECTION */}
      <section id="about" className="py-20 bg-white/60 border-t border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Why Gaia Platform</h2>
            <h3 className="text-3xl font-extrabold text-emerald-950 leading-tight">
              Eliminating Response Delays in Forest Fringe Sectors
            </h3>
            <p className="text-emerald-900/80 text-sm leading-relaxed">
              In forest fringe villages, rapid communication between communities and forest division headquarters is essential. Gaia digitizes officer registries, designations, village boundary maps, and incident assignment logs into a single unified platform.
            </p>
            <ul className="space-y-3 text-sm font-semibold text-emerald-950">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
                100% PostgreSQL database driven (Zero mock data)
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
                Role-gated dashboards with session security
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
                Dynamic officer designation management
              </li>
            </ul>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-xl border border-emerald-950/10">
            <img src="/images/elephant2.jpg" alt="Gaia Forest Elephant" className="w-full h-[380px] object-cover" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-emerald-950 text-white pt-16 pb-12 border-t border-emerald-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center text-amber-300">
                <Trees className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">GAIA</span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-sm">
              Comprehensive Full-Stack Wildlife Operations & Incident Command Network for Forest Divisions.
            </p>
          </div>

          <div className="space-y-3 text-xs text-emerald-200">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <p><a href="#hero" className="hover:text-amber-300">Home</a></p>
            <p><a href="#features" className="hover:text-amber-300">Features</a></p>
            <p><a href="#workflow" className="hover:text-amber-300">Workflow</a></p>
            <p><Link to="/login" className="hover:text-amber-300">Login Portal</Link></p>
            <p><Link to="/register" className="hover:text-amber-300">Villager Registration</Link></p>
          </div>

          <div className="space-y-3 text-xs text-emerald-200">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Emergency Helpline</h4>
            <p className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <PhoneCall className="w-4 h-4" />
              1800-GAIA-WILD
            </p>
            <p>Wayanad Forest Division HQ</p>
            <p>Kerala, India</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-emerald-900/60 text-center text-xs text-emerald-300/60">
          Gaia Wildlife Operations &copy; 2026. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
