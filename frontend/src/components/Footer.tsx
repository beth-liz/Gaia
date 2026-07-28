import { Leaf } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-8">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-bold text-base text-gray-900">Gaia Platform</span>
        </div>
        <p className="text-xs text-gray-500 text-center md:text-left font-semibold">
          &copy; {new Date().getFullYear()} Gaia Wildlife Monitoring System. All rights reserved.
        </p>
        <div className="flex space-x-4 mt-4 md:mt-0 text-xs font-bold text-gray-500">
          <a href="#" className="hover:text-primary transition">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
