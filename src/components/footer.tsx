import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold text-lg">
                RB
              </div>
              <span className="text-xl font-bold">Rugby Buddy</span>
            </div>
            <p className="text-green-300 text-sm">
              Kids rugby training for all ages and abilities. Building confidence, teamwork, and a love for the game.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-green-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/media" className="text-green-300 hover:text-white transition-colors">Media</Link></li>
              <li><Link href="/profile/coach" className="text-green-300 hover:text-white transition-colors">Our Coach</Link></li>
              <li><Link href="/contact" className="text-green-300 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">For Parents</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="text-green-300 hover:text-white transition-colors">Register</Link></li>
              <li><Link href="/login" className="text-green-300 hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/dashboard/bookings" className="text-green-300 hover:text-white transition-colors">Book Sessions</Link></li>
              <li><Link href="/dashboard/messages" className="text-green-300 hover:text-white transition-colors">Messages</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Get in Touch</h3>
            <p className="text-green-300 text-sm">www.rugbybuddies.co.uk</p>
            <p className="text-green-300 text-sm mt-2">Follow us on social media for the latest updates and highlights!</p>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-8 text-center text-sm text-green-400">
          <p>&copy; {new Date().getFullYear()} Rugby Buddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
