import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Trees,
  ArrowRight,
  Users,
  ShieldCheck,
  ChevronDown,
  Activity,
  Globe2,
  AlertTriangle
} from "lucide-react";

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-[#e0e5e2] font-sans overflow-x-hidden selection:bg-emerald-900 selection:text-white">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${scrolled
          ? "bg-[#050806]/90 backdrop-blur-xl border-white/10 py-4 shadow-lg shadow-black/50"
          : "bg-transparent py-6"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Trees className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <span className="text-2xl font-serif font-bold tracking-widest text-white block shadow-sm">GAIA</span>
          </Link>

          {/* Desktop Nav Links (Font-serif) */}
          <div className="hidden md:flex items-center gap-10 text-sm font-serif font-medium text-gray-200">
            <a href="#about-mission" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">About</a>
            <a href="#about-mission" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">Mission</a>
            <a href="#capabilities" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">Capabilities</a>
            <a href="#workflow" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all tracking-wide">Workflow</a>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:block text-sm font-serif font-medium text-gray-200 hover:text-white transition-colors tracking-wide"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white text-sm font-medium transition-all flex items-center gap-2 border border-emerald-500/30 hover:border-emerald-400"
            >
              Register
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative h-screen w-full flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/images/tiger2.jpg"
            alt="Cinematic Wildlife Background"
            className="w-full h-full object-cover scale-105 animate-[kenburns_20s_ease-out_forwards]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d]/80 via-[#0a0f0d]/40 to-[#0a0f0d]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-8 animate-fade-in-up mt-20 lg:mt-0">
            <div className="inline-flex items-center gap-3">
              <div className="h-[1px] w-8 bg-emerald-500"></div>
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.3em] drop-shadow-md">
                Wildlife Intelligence Platform
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
              PROTECTING<br />WILDLIFE.<br />
              <span className="text-gray-300">UNDERSTANDING<br />THE WILD.</span>
            </h1>

            <p className="text-lg text-gray-200 leading-relaxed max-w-xl font-light drop-shadow-md">
              An intelligent platform for wildlife monitoring, human-wildlife conflict management, and forest operations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={scrollToNext}
                className="px-8 py-4 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-sm transition-all flex items-center gap-3 border border-emerald-500/50 shadow-lg"
              >
                EXPLORE GAIA
              </button>
              <Link
                to="/public/report-incident"
                className="px-8 py-4 rounded-full bg-amber-500/90 hover:bg-amber-400 text-[#0a0f0d] font-bold text-sm transition-all flex items-center gap-3 border border-amber-400/50 shadow-lg"
              >
                <AlertTriangle className="w-4 h-4" />
                REPORT INCIDENT
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/10 text-white font-medium text-sm border border-white/20 transition-all shadow-lg"
              >
                SIGN IN
              </Link>
            </div>
          </div>

          {/* Floating Cards (Decorative) */}
          <div className="hidden lg:block lg:col-span-4 relative h-[500px]">
            <div className="absolute top-10 right-0 w-64 bg-[#0a0f0d]/80 backdrop-blur-md p-4 border border-white/10 shadow-2xl animate-float-slow rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-emerald-400 tracking-wider">WILDLIFE DETECTION</span>
              </div>
              <p className="text-white text-sm font-serif">Elephant detected</p>
              <p className="text-gray-400 text-xs mt-1">98% confidence • Sector 4</p>
            </div>

            <div className="absolute top-48 -left-10 w-72 bg-[#0a0f0d]/80 backdrop-blur-md p-4 border border-red-900/40 shadow-2xl animate-float-delayed rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-bold text-red-400 tracking-wider">ACTIVE INCIDENT</span>
              </div>
              <p className="text-white text-sm font-serif">Human-Wildlife Conflict</p>
              <p className="text-gray-400 text-xs mt-1">Muthanga Region • Guard Dispatched</p>
            </div>

            <div className="absolute bottom-10 right-10 w-56 bg-[#0a0f0d]/80 backdrop-blur-md p-4 border border-blue-900/40 shadow-2xl animate-float rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-bold text-blue-400 tracking-wider">MONITORING STATION</span>
              </div>
              <p className="text-white text-sm font-serif">Station 04</p>
              <p className="text-gray-400 text-xs mt-1">ONLINE • Sensors Active</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer z-20 drop-shadow-lg" onClick={scrollToNext}>
          <span className="text-[10px] uppercase tracking-widest text-emerald-400">Scroll to Explore</span>
          <ChevronDown className="w-5 h-5 text-emerald-400 animate-bounce" />
        </div>
      </section>

      {/* COMBINED ABOUT + MISSION SECTION */}
      <section id="about-mission" className="relative min-h-screen w-full flex items-center py-24 overflow-hidden">
        {/* Shared Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img src="/images/nature1.jpg" alt="Forest Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0a0f0d]/85"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-transparent to-[#0a0f0d]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col justify-center">

          {/* Top Half: About Gaia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <span className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-4 block drop-shadow-md">
                ABOUT GAIA
              </span>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight drop-shadow-lg">
                WHEN WILDLIFE<br />
                <span className="text-gray-400">AND HUMAN LIFE</span><br />
                INTERSECT.
              </h2>
            </div>
            <div className="pl-0 lg:pl-12 border-l-0 lg:border-l border-white/20">
              <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed drop-shadow-md">
                GAIA brings wildlife detection, incident management, geographic intelligence, and forest operations into a single platform designed to help Forest Departments respond to human-wildlife conflict more effectively.
              </p>
            </div>
          </div>

          {/* Bottom Half: Mission / Detection to Action Flow */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg">
              FROM DETECTION <span className="text-emerald-500">TO ACTION.</span>
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto w-full">
            {/* The Live Flowing Animation Line */}
            <div className="absolute top-1/2 left-0 w-full h-[3px] bg-white/5 -translate-y-1/2 hidden md:block z-0 overflow-hidden rounded-full">
              <div className="w-full h-full animate-flow-line"></div>
            </div>

            <div className="flex flex-col md:flex-row justify-between relative z-10">
              {[
                { num: "01", title: "DETECT", desc: "Sensors & AI identify activity." },
                { num: "02", title: "REPORT", desc: "Incidents are logged rapidly." },
                { num: "03", title: "RESPOND", desc: "Officers assign field guards." },
                { num: "04", title: "VERIFY", desc: "Evidence is gathered on-site." },
                { num: "05", title: "PROTECT", desc: "Conflict is managed safely." }
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center mb-12 md:mb-0 group">
                  <div className="w-16 h-16 bg-[#0a0f0d]/80 backdrop-blur-sm border-2 border-white/20 rounded-full flex items-center justify-center mb-6 group-hover:border-emerald-500 group-hover:bg-emerald-900/60 transition-all shadow-xl shadow-emerald-900/20">
                    <span className="text-xl font-serif font-bold text-gray-200 group-hover:text-emerald-400 drop-shadow-md">{step.num}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 drop-shadow-md">{step.title}</h4>
                  <p className="text-sm text-gray-300 text-center max-w-[120px] drop-shadow-md font-light">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="capabilities" className="py-32 bg-[#0a0f0d] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-24">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight drop-shadow-lg">
              ONE PLATFORM.<br />
              <span className="text-gray-400">A COMPLETE WILDLIFE RESPONSE SYSTEM.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-20 gap-x-12">
            {/* Feature 1 - AI */}
            <div className="group">
              <div className="h-[300px] w-full bg-[#111814] mb-8 overflow-hidden relative border border-white/10 shadow-lg rounded-2xl">
                <img src="/images/elephant.jpg" alt="AI Detection" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d]/90 via-[#0a0f0d]/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 text-emerald-400 text-sm font-bold tracking-widest drop-shadow-md">
                  <Activity className="w-5 h-5" /> AI WILDLIFE DETECTION
                </div>
              </div>
              <p className="text-xl text-white font-serif mb-4 drop-shadow-sm">See wildlife. Understand what was detected.</p>
              <p className="text-gray-300 text-sm leading-relaxed drop-shadow-sm">Detect wildlife from captured images and identify species with confidence information. Turn observations into actionable intelligence.</p>
            </div>

            {/* Feature 2 - GIS */}
            <div className="group md:mt-24">
              <div className="h-[300px] w-full bg-[#111814] mb-8 overflow-hidden relative border border-white/10 shadow-lg rounded-2xl">
                <img src="/images/nature4.jpg" alt="GIS Intelligence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d]/90 via-[#0a0f0d]/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 text-emerald-400 text-sm font-bold tracking-widest drop-shadow-md">
                  <Globe2 className="w-5 h-5" /> GIS INTELLIGENCE
                </div>
              </div>
              <p className="text-xl text-white font-serif mb-4 drop-shadow-sm">Visualize the operational landscape.</p>
              <p className="text-gray-300 text-sm leading-relaxed drop-shadow-sm">Visualize incidents, monitoring stations, villages, and wildlife activity geographically. Identify areas where wildlife conflict incidents are concentrated via heat maps.</p>
            </div>

            {/* Feature 3 - Incident Management */}
            <div className="group">
              <div className="h-[300px] w-full bg-[#111814] mb-8 overflow-hidden relative border border-white/10 shadow-lg rounded-2xl">
                <img src="/images/nature5.jpg" alt="Incident Management" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d]/90 via-[#0a0f0d]/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 text-blue-400 text-sm font-bold tracking-widest drop-shadow-md">
                  <ShieldCheck className="w-5 h-5" /> INCIDENT MANAGEMENT
                </div>
              </div>
              <p className="text-xl text-white font-serif mb-4 drop-shadow-sm">Coordinate rapid response.</p>
              <p className="text-gray-300 text-sm leading-relaxed drop-shadow-sm">Manage human-wildlife conflict incidents from reporting through investigation, verification, and closure. Ensure no report is lost in paperwork.</p>
            </div>

            {/* Feature 4 - Forest Operations */}
            <div className="group md:mt-24">
              <div className="h-[300px] w-full bg-[#111814] mb-8 overflow-hidden relative border border-white/10 shadow-lg rounded-2xl">
                <img src="/images/nature2.jpg" alt="Forest Operations" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d]/90 via-[#0a0f0d]/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 text-amber-400 text-sm font-bold tracking-widest drop-shadow-md">
                  <Users className="w-5 h-5" /> FOREST OPERATIONS & INVENTORY
                </div>
              </div>
              <p className="text-xl text-white font-serif mb-4 drop-shadow-sm">Equip and empower field personnel.</p>
              <p className="text-gray-300 text-sm leading-relaxed drop-shadow-sm">Coordinate Head Officers and Forest Guards through structured field operations. Track equipment, issue requests, returns, and mission-related inventory.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW GAIA WORKS TIMELINE */}
      <section id="workflow" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img src="/images/elephant1.jpg" alt="Lifecycle Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0a0f0d]/85"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-transparent to-[#0a0f0d]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-20 text-center drop-shadow-lg">
            OPERATIONAL <span className="text-emerald-500">LIFECYCLE</span>
          </h2>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[3px] before:bg-white/5 before:rounded-full">
            {/* Live Vertical Animation Line */}
            <div className="absolute inset-0 ml-5 -translate-x-px md:mx-auto md:translate-x-0 h-full w-[3px] overflow-hidden rounded-full z-0">
              <div className="w-full h-full animate-flow-line-vertical"></div>
            </div>

            {[
              { step: "01", title: "REPORT", desc: "A wildlife conflict incident is reported by a registered villager." },
              { step: "02", title: "ROUTE", desc: "The incident reaches the relevant monitoring station." },
              { step: "03", title: "REVIEW", desc: "The Head Officer reviews the incident severity." },
              { step: "04", title: "ASSIGN", desc: "Forest Guards are assigned to the incident." },
              { step: "05", title: "FIELD OPERATION", desc: "Guards accept the mission, request required inventory, and perform field operations." },
              { step: "06", title: "EVIDENCE", desc: "Evidence and field findings are collected." },
              { step: "07", title: "REPORT", desc: "The final field report is generated." },
              { step: "08", title: "VERIFY", desc: "The Head Officer verifies the completed operation." },
              { step: "09", title: "CLOSE", desc: "The incident is formally closed and archived." },
            ].map((item, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active z-10">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/30 bg-[#0a0f0d]/90 backdrop-blur-sm text-gray-200 text-sm font-bold font-serif shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:border-emerald-500 group-hover:bg-emerald-900 group-hover:text-emerald-300 transition-all">
                  {item.step}
                </div>
                {/* Content */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl border border-white/10 bg-[#0a0f0d]/60 backdrop-blur-md group-hover:bg-[#0a0f0d]/90 transition-all shadow-xl">
                  <h3 className="font-bold text-white text-base mb-1 drop-shadow-md">{item.title}</h3>
                  <p className="text-gray-300 text-sm drop-shadow-md">{item.desc}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ROLE BASED ECOSYSTEM */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img src="/images/nature6.jpg" alt="Ecosystem Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0a0f0d]/85"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-transparent to-[#0a0f0d]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg text-center md:text-left">THE ECOSYSTEM</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 border border-white/10 rounded-2xl bg-[#0a0f0d]/70 backdrop-blur-md hover:border-emerald-500/50 hover:bg-[#0a0f0d]/90 transition-all shadow-xl">
              <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4 drop-shadow-sm">ADMIN</h3>
              <p className="text-gray-200 text-sm leading-relaxed drop-shadow-sm">Manage the ecosystem, stations, users, configuration, incidents, and analytics from a centralized command.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-2xl bg-[#0a0f0d]/70 backdrop-blur-md hover:border-emerald-500/50 hover:bg-[#0a0f0d]/90 transition-all shadow-xl">
              <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4 drop-shadow-sm">HEAD OFFICER</h3>
              <p className="text-gray-200 text-sm leading-relaxed drop-shadow-sm">Review incidents, assign Forest Guards, monitor field operations, and verify completion reports.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-2xl bg-[#0a0f0d]/70 backdrop-blur-md hover:border-emerald-500/50 hover:bg-[#0a0f0d]/90 transition-all shadow-xl">
              <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4 drop-shadow-sm">FOREST GUARD</h3>
              <p className="text-gray-200 text-sm leading-relaxed drop-shadow-sm">Receive missions, perform field operations, collect evidence, request inventory, and submit reports.</p>
            </div>
            <div className="p-8 border border-white/10 rounded-2xl bg-[#0a0f0d]/70 backdrop-blur-md hover:border-emerald-500/50 hover:bg-[#0a0f0d]/90 transition-all shadow-xl">
              <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4 drop-shadow-sm">VILLAGER</h3>
              <p className="text-gray-200 text-sm leading-relaxed drop-shadow-sm">Report human-wildlife conflict incidents to authorities and receive relevant safety information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WILDLIFE VISUAL STORY */}
      <section className="relative py-48 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-[#0a0f0d]">
          <img
            src="/images/deer.jpg"
            alt="Forest Story"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0a0f0d]/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-[#0a0f0d]/20 to-[#0a0f0d]"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-6 drop-shadow-xl">
            THE WILD DOESN'T <br /> WAIT FOR PAPERWORK.
          </h2>
          <p className="text-2xl text-gray-200 font-light mb-10 drop-shadow-md">
            GAIA helps turn observations, reports, and field intelligence into coordinated action.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/40 bg-black/30 backdrop-blur-sm text-white font-medium text-sm hover:bg-white/20 transition-all shadow-lg"
          >
            EXPLORE THE PLATFORM
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img src="/images/tiger5.jpg" alt="Future Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0a0f0d]/75"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-transparent to-[#0a0f0d]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight mb-6 drop-shadow-lg">
            THE FUTURE OF WILDLIFE MONITORING STARTS WITH BETTER INTELLIGENCE.
          </h2>
          <p className="text-gray-200 text-xl mb-12 drop-shadow-md font-light">
            Explore Gaia and discover a unified approach to wildlife monitoring and human-wildlife conflict management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-700/90 backdrop-blur-sm hover:bg-emerald-600 text-white font-medium text-sm transition-colors border border-emerald-500/50 shadow-lg"
            >
              SIGN IN TO DASHBOARD
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white font-medium text-sm transition-colors shadow-lg"
            >
              REGISTER AS VILLAGER
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#020302] border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <Trees className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-serif font-bold tracking-widest text-white block drop-shadow-sm">GAIA</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm uppercase tracking-widest leading-relaxed">
              AI-POWERED WILDLIFE MONITORING AND HUMAN-WILDLIFE CONFLICT MANAGEMENT PLATFORM
            </p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="text-white text-xs font-bold tracking-widest uppercase">Platform</h4>
            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <a href="#about-mission" className="hover:text-emerald-400 transition-colors">About Gaia</a>
              <a href="#capabilities" className="hover:text-emerald-400 transition-colors">Features</a>
              <a href="#workflow" className="hover:text-emerald-400 transition-colors">Technology</a>
              <a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-white text-xs font-bold tracking-widest uppercase">Access</h4>
            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <Link to="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-emerald-400 transition-colors">Register as Villager</Link>
              <Link to="/public/report-incident" className="hover:text-emerald-400 transition-colors">Report Public Incident</Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-gray-600">
          <p>© 2026 Gaia.</p>
          <p className="mt-2 md:mt-0 uppercase tracking-widest font-serif">Built for smarter wildlife conservation.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
