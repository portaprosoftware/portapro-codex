import React from 'react';
import { Building2, Users, Target, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6">
            About PortaPro
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Revolutionizing portable sanitation management with innovative technology solutions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Mission Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              We're dedicated to transforming the portable sanitation industry through cutting-edge 
              technology that streamlines operations, improves efficiency, and delivers exceptional 
              customer experiences.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg bg-card shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Innovation</h3>
            <p className="text-sm text-muted-foreground">
              Continuously pushing boundaries with modern technology solutions
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Customer First</h3>
            <p className="text-sm text-muted-foreground">
              Every feature designed with our customers' success in mind
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Reliability</h3>
            <p className="text-sm text-muted-foreground">
              Building dependable solutions that work when you need them
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Excellence</h3>
            <p className="text-sm text-muted-foreground">
              Committed to delivering the highest quality in everything we do
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-8">Our Story</h2>
          <div className="prose max-w-none text-muted-foreground">
            <p className="text-lg mb-6">
              Founded with a vision to modernize the portable sanitation industry, PortaPro emerged 
              from the recognition that traditional management methods weren't keeping pace with 
              business needs.
            </p>
            <p className="text-lg mb-6">
              Our team of industry experts and technology innovators came together to create a 
              comprehensive platform that addresses the unique challenges faced by portable toilet 
              rental companies every day.
            </p>
            <p className="text-lg">
              Today, PortaPro serves businesses of all sizes, from small local operations to 
              large-scale enterprises, helping them streamline operations, reduce costs, and 
              deliver exceptional service to their customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}