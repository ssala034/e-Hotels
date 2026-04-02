'use client';

import Link from 'next/link';
import { Hotel } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Hotel className="h-6 w-6 text-sky-300" />
              <span className="text-lg font-bold">e-Hotels</span>
            </div>
            <p className="text-sm text-slate-300">
              Your premier destination for hotel bookings across North America.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-slate-300 transition-colors hover:text-sky-200">
                  Search Rooms
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-300 transition-colors hover:text-sky-200">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 transition-colors hover:text-sky-200">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-300 transition-colors hover:text-sky-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 transition-colors hover:text-sky-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 transition-colors hover:text-sky-200">
                  Cancellation Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>support@ehotels.com</li>
              <li>1-800-EHOTELS</li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} e-Hotels. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
