"use client"
import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"


export default function Navbar() {
  
  const router=useRouter()
  const [searchQuery, setSearchQuery] = useState("")


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search/${searchQuery}`)
    }
  }
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-l pl-2 md:text-xl font-bold">AnimeWithDev</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center w-3/6 md:w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anime..."
              className="w-full pl-10 pr-4 py-1.5 rounded-full bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Login Button */}
        <button className="px-1 py-0.5 rounded-lg bg-primary text-sm  md:text-l md:px-4 md:py-1 text-primary-foreground hover:bg-primary/90 transition">
          Login
        </button>
      </div>
    </nav>
  )
}