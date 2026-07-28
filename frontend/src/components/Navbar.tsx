import { Link } from "react-router-dom"
import { Leaf } from "lucide-react"
import { Button } from "./ui/button"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <Link to="/" className="flex items-center space-x-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight text-gray-900">Gaia</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6 text-xs font-bold text-gray-600">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-700 hover:text-primary">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-primary hover:bg-primary/95 text-white shadow-sm px-4 py-2 rounded-xl">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
