'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Beauty <span className="text-blue-600">Booking</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional booking system for beauty salons
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Calendar</h3>
            <p className="text-gray-600">Beautiful day, week, and month views</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Clients</h3>
            <p className="text-gray-600">Manage your customer base and history</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Finances</h3>
            <p className="text-gray-600">Track income and expenses</p>
          </div>
        </div>
      </div>
    </div>
  );
}