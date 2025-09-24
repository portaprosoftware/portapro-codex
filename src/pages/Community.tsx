import React from 'react';
import { Users, MessageCircle, Heart, Calendar, Star, ArrowRight } from 'lucide-react';

export default function Community() {
  const communityStats = [
    { label: "Active Members", value: "2,500+", icon: Users },
    { label: "Discussions", value: "850+", icon: MessageCircle },
    { label: "Solutions Shared", value: "1,200+", icon: Heart },
    { label: "Monthly Events", value: "12+", icon: Calendar }
  ];

  const communityChannels = [
    {
      title: "General Discussion",
      description: "Share experiences, ask questions, and connect with fellow business owners",
      members: "1,200+",
      activity: "Very Active"
    },
    {
      title: "Feature Requests",
      description: "Suggest new features and vote on upcoming platform improvements",
      members: "800+",
      activity: "Active"
    },
    {
      title: "Best Practices",
      description: "Learn from industry experts and share your own successful strategies",
      members: "950+",
      activity: "Very Active"
    },
    {
      title: "Technical Support",
      description: "Get help with platform features and troubleshoot any issues",
      members: "650+",
      activity: "Active"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6">
            PortaPro Community
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Connect, learn, and grow with fellow portable sanitation professionals
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Community Stats */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {communityStats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Benefits */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Why Join Our Community?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Network & Connect</h3>
              <p className="text-muted-foreground">
                Build relationships with industry peers, share experiences, and learn from others' successes.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Learn Best Practices</h3>
              <p className="text-muted-foreground">
                Discover proven strategies, industry insights, and expert tips to grow your business.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Get Support</h3>
              <p className="text-muted-foreground">
                Access help from both community members and our dedicated support team.
              </p>
            </div>
          </div>
        </div>

        {/* Community Channels */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Community Channels</h2>
          <div className="space-y-6">
            {communityChannels.map((channel, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{channel.title}</h3>
                    <p className="text-muted-foreground mb-4 sm:mb-0">{channel.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      <div>{channel.members} members</div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          channel.activity === 'Very Active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        {channel.activity}
                      </div>
                    </div>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm">
                      Join <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join CTA */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Join?</h3>
            <p className="text-muted-foreground mb-6">
              Become part of a thriving community of portable sanitation professionals. 
              Connect, learn, and grow your business with industry peers.
            </p>
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-lg">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}