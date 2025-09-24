import React from 'react';
import { Calendar, FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6">
            Terms of Service
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Please read these terms carefully before using PortaPro services
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

          {/* Terms Content */}
          <div className="prose max-w-none text-foreground">
            <div className="bg-card rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Agreement Overview</h2>
              </div>
              <p className="text-muted-foreground">
                By accessing and using PortaPro's services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, 
                you are prohibited from using our services.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Service Description</h2>
              <p className="text-muted-foreground mb-4">
                PortaPro provides a comprehensive software platform for managing portable sanitation businesses, 
                including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Fleet and inventory management</li>
                <li>Customer relationship management</li>
                <li>Scheduling and routing optimization</li>
                <li>Financial reporting and analytics</li>
                <li>Mobile applications for field operations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. User Accounts and Responsibilities</h2>
              <p className="text-muted-foreground mb-4">
                To access our services, you must create an account and provide accurate, complete information. 
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Promptly notifying us of any unauthorized use</li>
                <li>Ensuring your use complies with applicable laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Payment Terms</h2>
              <p className="text-muted-foreground mb-4">
                Our services are provided on a subscription basis. Payment terms include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Fees are charged in advance for each billing cycle</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>Price changes will be communicated 30 days in advance</li>
                <li>Failure to pay may result in service suspension</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Data and Privacy</h2>
              <p className="text-muted-foreground mb-4">
                We are committed to protecting your data and privacy:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Your data remains your property</li>
                <li>We implement industry-standard security measures</li>
                <li>Data processing is governed by our Privacy Policy</li>
                <li>You can request data export or deletion</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Service Availability</h2>
              <p className="text-muted-foreground mb-4">
                We strive to maintain high service availability, but cannot guarantee 100% uptime. 
                We reserve the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Perform scheduled maintenance with advance notice</li>
                <li>Suspend service for security or legal reasons</li>
                <li>Update and modify our platform</li>
                <li>Discontinue features with reasonable notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The PortaPro platform, including all software, content, and materials, is protected by 
                intellectual property laws. You may not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Copy, modify, or distribute our software</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use our trademarks without permission</li>
                <li>Create derivative works based on our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, PortaPro shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
              <p className="text-muted-foreground mb-4">
                Either party may terminate this agreement at any time. Upon termination:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Your access to the service will be discontinued</li>
                <li>Data export may be available for a limited time</li>
                <li>Payment obligations remain for services already provided</li>
                <li>Surviving provisions will remain in effect</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-card rounded-lg p-4 mt-4">
                <p className="text-foreground font-medium">PortaPro Legal Team</p>
                <p className="text-muted-foreground">Email: legal@portapro.com</p>
                <p className="text-muted-foreground">Phone: (216) 412-3239</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}