import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Image 
            src="/logo-vaccini.png"
            alt="Logo Vaccini"
            width={200}
            height={50}
            priority
          />
          {/* Empty header - navigation removed as requested */}
        </div>
      </div>
    </header>
  )
}

