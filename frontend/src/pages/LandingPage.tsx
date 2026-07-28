import { useNavigate } from "react-router-dom"
import { Leaf, Eye, Shield, ArrowRight, Sparkles, HeartHandshake, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  const navigate = useNavigate()

  const speciesList = [
    {
      name: "Asian Elephant",
      image: "/images/elephant1.jpg",
      status: "High Sighting Frequency",
      description: "Tracked along major migration corridors with early warning acoustic alerts."
    },
    {
      name: "Bengal Tiger",
      image: "/images/tiger1.jpg",
      status: "Monitored Apex Predator",
      description: "Territorial movement mapped via dual-spectrum thermal sensor nodes."
    },
    {
      name: "Spotted Deer",
      image: "/images/deer.jpg",
      status: "Prey Base Density",
      description: "Monitored across perimeter buffer zones and agricultural forest fringes."
    },
    {
      name: "Indian Wild Boar",
      image: "/images/wildboar1.jpg",
      status: "Crop Protection Active",
      description: "Protected using solar bio-fence systems and high-frequency deterrence."
    }
  ]

  const features = [
    {
      icon: Eye,
      title: "AI Wildlife Detection",
      desc: "Real-time thermal image recognition identifying species and movement vectors instantly."
    },
    {
      icon: ShieldAlert,
      title: "Community SOS Alerts",
      desc: "One-touch incident reporting for local residents to notify patrol teams in seconds."
    },
    {
      icon: Shield,
      title: "Tactical Ranger Dispatch",
      desc: "Streamlined field response coordination for assigned patrol officers."
    },
    {
      icon: HeartHandshake,
      title: "Coexistence & Safety",
      desc: "Harmonizing human agricultural settlements with natural wildlife corridors."
    }
  ]

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900 font-sans antialiased flex flex-col">
      
      {/* Top Navbar */}
      <header className="bg-[#0b2316] text-white px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="mx-auto max-w-[1300px] flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold shadow-md">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white leading-none">gaia</span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mt-0.5">
                Wildlife Platform
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" className="text-slate-200 hover:text-white" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button className="bg-[#10b981] hover:bg-[#059669] text-white font-bold" onClick={() => navigate("/register")}>
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#0b2316] text-white pt-16 pb-24 px-6 overflow-hidden">
        
        {/* Background Wildlife Media with Blur Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/nature1.jpg" 
            alt="Gaia Wildlife" 
            className="w-full h-full object-cover opacity-35 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b2316]/80 via-[#0b2316]/90 to-[#0b2316]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1100px] text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 text-emerald-300 text-xs font-bold shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Modern Wildlife Monitoring & Conflict Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white max-w-4xl mx-auto">
            Protecting Communities. Preserving Wildlife Corridors.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Gaia connects local residents, ranger teams, and automated early warning sensors in one simple, elegant, nature-inspired SaaS platform.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[#10b981] hover:bg-[#059669] text-white font-bold shadow-lg h-12 px-8 rounded-2xl" onClick={() => navigate("/register")}>
              Explore Gaia Platform <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-12 px-8 rounded-2xl" onClick={() => navigate("/login")}>
              Sign In to Portal
            </Button>
          </div>

          {/* Quick Stat Pill Bar */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">140+</span>
              <p className="text-xs text-slate-300 font-medium">Monitoring Nodes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-extrabold text-white font-mono">99.2%</span>
              <p className="text-xs text-slate-300 font-medium">Conflict Prevention</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">&lt; 10m</span>
              <p className="text-xs text-slate-300 font-medium">Avg Response Time</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-1">
              <span className="text-2xl font-extrabold text-white font-mono">18</span>
              <p className="text-xs text-slate-300 font-medium">Protected Villages</p>
            </div>
          </div>
        </div>

      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <Badge variant="emerald">Platform Capabilities</Badge>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Designed for Speed, Safety & Clarity
            </h2>
            <p className="text-xs text-slate-500">
              Everything you need to monitor wildlife movement and manage community incidents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon
              return (
                <div key={idx} className="p-6 bg-[#f8faf7] border border-slate-200/80 rounded-2xl space-y-3 hover:shadow-md transition duration-200">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Species Gallery */}
      <section className="py-16 px-6 bg-[#f8faf7] flex-grow">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <Badge variant="emerald">Species Catalog</Badge>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Monitored Wildlife
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              View Platform Stream
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {speciesList.map((sp, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition space-y-3 p-4">
                <div className="h-44 rounded-xl overflow-hidden border border-slate-100 relative">
                  <img src={sp.image} alt={sp.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                </div>
                <div className="space-y-1">
                  <Badge variant="warning">{sp.status}</Badge>
                  <h3 className="text-sm font-extrabold text-slate-900 pt-1">{sp.name}</h3>
                  <p className="text-xs text-slate-600 leading-normal">{sp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-16 px-6 bg-[#0b2316] text-white">
        <div className="mx-auto max-w-[1000px] bg-gradient-to-r from-[#123c27] to-[#10b981] p-10 rounded-3xl text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to experience modern wildlife monitoring?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
            Get started today with our resident portal or officer dispatch dashboard.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button size="lg" className="bg-white text-[#0b2316] hover:bg-slate-100 font-extrabold shadow-md h-11 px-8 rounded-2xl" onClick={() => navigate("/register")}>
              Create Account Now
            </Button>
          </div>
        </div>
      </section>

      {/* Modern Sleek Footer */}
      <footer className="bg-[#0b2316] text-white border-t border-[#123c27] px-6 py-8">
        <div className="mx-auto max-w-[1200px] flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-[#10b981] text-white flex items-center justify-center font-bold">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-white">gaia</span>
            <span>© 2026 Gaia Platform Inc. All rights reserved.</span>
          </div>

          <div className="flex space-x-6">
            <a href="#privacy" className="hover:text-white">Privacy</a>
            <a href="#terms" className="hover:text-white">Terms</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
