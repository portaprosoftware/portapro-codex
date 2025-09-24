import React from 'react';
import { Shield, Lock, Eye, Database, Calendar, ArrowLeft } from 'lucide-react';
import { LandingLogo } from '@/components/ui/landing-logo';

export default function Privacy() {
  const privacyPrinciples = [
    {
      icon: Shield,
      title: "Data Protection",
      description: "We implement robust security measures to protect your personal and business data"
    },
    {
      icon: Lock,
      title: "Secure Storage",
      description: "All data is encrypted both in transit and at rest using industry-standard protocols"
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "We clearly communicate what data we collect and how it's used"
    },
    {
      icon: Database,
      title: "Data Ownership",
      description: "Your data belongs to you - we're just the custodians keeping it safe"
    }
  ];

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
            Privacy Policy
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Your privacy is important to us. Learn how we protect and handle your data.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Last Updated */}
          <div className="flex items-center gap-2 text-muted-foreground mb-8">
            <Calendar className="w-4 h-4" />
            <span>Last updated: March 1, 2024</span>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {privacyPrinciples.map((principle, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <principle.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{principle.title}</h3>
                    <p className="text-sm text-muted-foreground">{principle.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Policy Content */}
          <div className="prose max-w-none text-foreground">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support:
              </p>
              <h3 className="text-lg font-semibold mb-2">Account Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
                <li>Name, email address, and contact information</li>
                <li>Company information and business details</li>
                <li>Payment and billing information</li>
                <li>User preferences and settings</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2">Business Data</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Customer and job information</li>
                <li>Fleet and inventory data</li>
                <li>Financial and reporting data</li>
                <li>Location and route information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and operate the PortaPro platform</li>
                <li>Process payments and manage your account</li>
                <li>Send important updates and communications</li>
                <li>Provide customer support and assistance</li>
                <li>Improve our services and develop new features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With trusted service providers under strict confidentiality agreements</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement comprehensive security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>End-to-end encryption for data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Regular security audits and assessments</li>
                <li>Multi-factor authentication for admin access</li>
                <li>SOC 2 Type II compliance</li>
                <li>24/7 security monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Your Rights and Choices</h2>
              <p className="text-muted-foreground mb-4">
                You have several rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access and review your personal data</li>
                <li>Request corrections to inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Export your data in portable formats</li>
                <li>Opt out of marketing communications</li>
                <li>Restrict certain data processing activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your information for as long as necessary to provide our services and comply 
                with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Account data: Retained while your account is active</li>
                <li>Business data: Retained according to your subscription plan</li>
                <li>Financial records: Retained for 7 years for tax purposes</li>
                <li>Support communications: Retained for 3 years</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for international transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by email or through our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-card rounded-lg p-4">
                <p className="text-foreground font-medium">PortaPro Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@portapro.com</p>
                <p className="text-muted-foreground">Phone: (216) 412-3239</p>
                <p className="text-muted-foreground">Address: Privacy Officer, PortaPro Inc.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}