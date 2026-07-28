import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Leaf, User, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<"villager" | "officer">("villager")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [village, setVillage] = useState("Chundale Settlement")
  const [password, setPassword] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      localStorage.setItem("authToken", "sample-token")
      localStorage.setItem("userRole", role)
      navigate(role === "officer" ? "/officer/dashboard" : "/villager/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#0b2316] text-slate-900 font-sans antialiased flex items-center justify-center p-4 lg:p-6">
      
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] border border-[#123c27]/20">
        
        {/* Left Side Media Overlay (5 cols) */}
        <div className="md:col-span-5 relative bg-[#0b2316] text-white p-8 flex flex-col justify-between hidden md:flex">
          <div className="absolute inset-0 z-0">
            <img src="/images/nature3.jpg" alt="Gaia Nature" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b2316] via-[#0b2316]/70 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#10b981] text-white flex items-center justify-center font-bold">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white">gaia</span>
          </div>

          <div className="relative z-10 space-y-3 my-auto py-6">
            <h2 className="text-xl font-extrabold text-white leading-tight">
              Join the Wildlife Monitoring Network
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect with local safety leads, report wildlife sightings instantly, and protect community borders.
            </p>
          </div>

          <div className="relative z-10 text-[11px] text-slate-400">
            Protected by 256-bit encryption.
          </div>
        </div>

        {/* Right Side Form (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 bg-white flex flex-col justify-center space-y-5">
          
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-xs text-slate-500 font-medium">Get started with Gaia in under a minute.</p>
          </div>

          {isSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-sm font-extrabold text-slate-900">Registration Successful!</h3>
              <p className="text-xs text-slate-600">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              
              {/* Role Select */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px]">Account Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole("villager")}
                    className={`py-1.5 font-bold rounded-lg transition ${
                      role === "villager" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Resident Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("officer")}
                    className={`py-1.5 font-bold rounded-lg transition ${
                      role === "officer" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Ranger / Officer
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Village Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Village / Zone Sector</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select 
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="Chundale Settlement">Chundale Settlement</option>
                    <option value="Pulpally Border Village">Pulpally Border Village</option>
                    <option value="Sulthan Bathery Sector">Sulthan Bathery Sector</option>
                    <option value="Kurichiad Sanctuary Zone">Kurichiad Sanctuary Zone</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold h-10 rounded-xl mt-2">
                Create Account <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

            </form>
          )}

          <p className="text-center text-xs text-slate-500 font-medium">
            Already registered?{" "}
            <Link to="/login" className="font-extrabold text-[#10b981] hover:underline">
              Sign In
            </Link>
          </p>

        </div>

      </div>

    </div>
  )
}
