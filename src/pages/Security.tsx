import React from 'react';
import { Shield, Lock, Eye, Server, Award, CheckCircle } from 'lucide-react';

export default function Security() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Military-grade encryption and security protocols protect your sensitive business data"
    },
    {
      icon: Lock,
      title: "Multi-Factor Authentication",
      description: "Advanced authentication methods ensure only authorized users access your account"
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Cloud-based infrastructure with 99.9% uptime and redundant backup systems"
    },
    {
      icon: Eye,
      title: "24/7 Monitoring",
      description: "Continuous security monitoring and threat detection to keep your data safe"
    }
  ];

  const certifications = [
    { name: "SOC 2 Type II", status: "Certified" },
    { name: "GDPR Compliant", status: "Verified" },
    { name: "CCPA Compliant", status: "Verified" },
    { name: "ISO 27001", status: "In Progress" }
  ];

  const securityMeasures = [
    "AES-256 encryption for data at rest",
    "TLS 1.3 encryption for data in transit",
    "Regular penetration testing",
    "Automated vulnerability scanning",
    "Role-based access controls",
    "Audit logging and monitoring",
    "Secure development lifecycle",
    "Regular security training for staff"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6">
            Security & Compliance
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Your data security is our top priority. Learn about our comprehensive security measures.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Security Features */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Security Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Certifications & Compliance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-primary" />
                    <span className="font-semibold text-foreground">{cert.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">{cert.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Measures */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Security Measures</h2>
          <div className="bg-card rounded-lg p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-4">
              {securityMeasures.map((measure, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Protection */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Data Protection</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Encryption</h3>
              <p className="text-muted-foreground text-sm">
                All data is encrypted using industry-standard AES-256 encryption, both at rest and in transit.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Backup & Recovery</h3>
              <p className="text-muted-foreground text-sm">
                Automated daily backups with point-in-time recovery ensure your data is always protected.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Access Control</h3>
              <p className="text-muted-foreground text-sm">
                Role-based permissions and multi-factor authentication control who can access your data.
              </p>
            </div>
          </div>
        </div>

        {/* Security Contact */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Security Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our security team is available to answer any questions about our security practices 
              and compliance measures.
            </p>
            <div className="space-y-2">
              <p className="text-foreground font-medium">Security Team</p>
              <p className="text-muted-foreground">security@portapro.com</p>
              <p className="text-muted-foreground">(216) 412-3239</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}