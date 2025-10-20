import React from 'react';
import { CheckCircle, Target, Users, Book, Heart, ArrowLeft } from 'lucide-react';
import { LandingLogo } from '@/components/ui/landing-logo';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </a>
          </div>
          <LandingLogo />
          <div className="w-24"></div> {/* Spacer for centering logo */}
        </div>
      </header>

      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6">
            About PortaPro
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Software built the way your industry actually works
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Who We Are */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-8 sm:p-12 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">WHO WE ARE</h2>
            <p className="text-lg sm:text-xl leading-relaxed">
              Software built the way your industry actually works. PortaPro is the all-in-one operations platform built specifically for portable toilet rental companies. No more forcing your business into tools made for plumbers, HVAC, or spreadsheets. PortaPro gives operators, dispatchers, drivers, and office teams one clean system to manage routes, inventory, customers, billing, and service—without the chaos of paper or ten different apps.
            </p>
          </div>
        </div>

        {/* Why We Exist */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">WHY WE EXIST</h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Running a sanitation business shouldn't require fighting software or drowning in paperwork. Most operators either outgrow spreadsheets or get stuck paying for overbuilt software that doesn't match how the field really works. PortaPro fixes that—by giving operators a platform designed around their exact workflow, not the other way around.
          </p>
        </div>

        {/* What Makes PortaPro Different */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">WHAT MAKES PORTAPRO DIFFERENT</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-primary pl-6 py-4">
              <h3 className="font-bold text-xl mb-3 text-foreground">Route Planning & Live Service Updates</h3>
              <p className="text-muted-foreground mb-3 text-lg">
                Drag-and-drop scheduling, daily driver routes, arrival/service tracking.
              </p>
              <p className="text-muted-foreground italic">
                <strong>Why It Matters:</strong> Stops missed services and "where's my driver?" phone calls. Office and field stay in sync in real time.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6 py-4">
              <h3 className="font-bold text-xl mb-3 text-foreground">Unit & Inventory Tracking (QR / Barcode)</h3>
              <p className="text-muted-foreground mb-3 text-lg">
                Scan units as they leave the yard, change locations, or need repairs. Tracks wash history and damage.
              </p>
              <p className="text-muted-foreground italic">
                <strong>Why It Matters:</strong> No more missing toilets or guessing where assets are. Every unit has a history and a location.
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-6 py-4">
              <h3 className="font-bold text-xl mb-3 text-foreground">Quotes → Jobs → Invoices (Tap-to-Pay)</h3>
              <p className="text-muted-foreground mb-3 text-lg">
                Build quotes, convert to jobs, convert to invoices with one click. Take card or ACH payments on-site or online.
              </p>
              <p className="text-muted-foreground italic">
                <strong>Why It Matters:</strong> Ends unpaid work and check-chasing. Makes even small operators look professional and modern.
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-6 py-4">
              <h3 className="font-bold text-xl mb-3 text-foreground">100% Mobile Driver App (Works Offline)</h3>
              <p className="text-muted-foreground mb-3 text-lg">
                Drivers complete routes, log services, add photos, collect signatures—all from their phone.
              </p>
              <p className="text-muted-foreground italic">
                <strong>Why It Matters:</strong> No training required. Works even without cell service in rural areas or event fields.
              </p>
            </div>

            <div className="border-l-4 border-orange-600 pl-6 py-4">
              <h3 className="font-bold text-xl mb-3 text-foreground">Automated Customer Alerts & Service Logs</h3>
              <p className="text-muted-foreground mb-3 text-lg">
                Text or email customers when units are delivered, serviced, or picked up—with photos if needed.
              </p>
              <p className="text-muted-foreground italic">
                <strong>Why It Matters:</strong> Fewer customer calls. More trust. You look organized and accountable.
              </p>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-muted/30 rounded-2xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">OUR STORY</h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Founded in 2025, PortaPro was built after seeing operators run million-dollar fleets from clipboards, whiteboards, and outdated software that didn't fit the job. We knew this industry deserved better—software designed for how operators actually work in the field, not how consultants think they should.
              </p>
              <p>
                Today, PortaPro is trusted by rental fleets across North America—family-owned companies, event specialists, and multi-truck operations who want a simpler, more profitable way to run their business.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">OUR VALUES</h2>
          <div className="grid gap-6">
            <div className="p-6 rounded-lg bg-card shadow-sm border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2 text-foreground">Field First</h3>
                  <p className="text-muted-foreground text-lg">
                    If it doesn't work at 6 AM in the rain, we don't ship it.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card shadow-sm border-l-4 border-blue-600">
              <div className="flex items-start gap-4">
                <Target className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2 text-foreground">Simple Wins</h3>
                  <p className="text-muted-foreground text-lg">
                    Software should make work easier—not add more steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card shadow-sm border-l-4 border-green-600">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2 text-foreground">Operators Over Investors</h3>
                  <p className="text-muted-foreground text-lg">
                    We build for the people in the field, not the boardroom.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card shadow-sm border-l-4 border-purple-600">
              <div className="flex items-start gap-4">
                <Book className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2 text-foreground">Share the Playbook</h3>
                  <p className="text-muted-foreground text-lg">
                    We openly share templates, pricing strategies, and industry best practices.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card shadow-sm border-l-4 border-orange-600">
              <div className="flex items-start gap-4">
                <Heart className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-xl mb-2 text-foreground">Respect the Work</h3>
                  <p className="text-muted-foreground text-lg">
                    This industry runs on grit and service. We build tools that honor that.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
