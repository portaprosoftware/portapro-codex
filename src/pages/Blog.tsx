import React from 'react';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Portable Sanitation Management",
      excerpt: "Discover how technology is transforming the portable toilet rental industry and what it means for your business.",
      author: "Sarah Johnson",
      date: "March 15, 2024",
      readTime: "5 min read",
      category: "Industry Insights",
      image: "/api/placeholder/400/250"
    },
    {
      id: 2,
      title: "Maximizing ROI with Fleet Management Technology",
      excerpt: "Learn proven strategies to optimize your fleet operations and increase profitability through smart technology adoption.",
      author: "Mike Chen",
      date: "March 10, 2024",
      readTime: "7 min read",
      category: "Business Tips",
      image: "/api/placeholder/400/250"
    },
    {
      id: 3,
      title: "Customer Service Excellence in the Digital Age",
      excerpt: "How modern CRM tools are helping portable sanitation companies deliver exceptional customer experiences.",
      author: "Lisa Rodriguez",
      date: "March 5, 2024",
      readTime: "4 min read",
      category: "Customer Success",
      image: "/api/placeholder/400/250"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-6">
            PortaPro Blog
          </h1>
          <p className="text-xl sm:text-2xl text-center text-white/90 max-w-3xl mx-auto">
            Industry insights, best practices, and updates from the world of portable sanitation
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Featured Post */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-primary/20 to-primary/10"></div>
            <div className="p-8">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                  Featured
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  March 20, 2024
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  8 min read
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Complete Guide to Portable Toilet Rental Business Automation
              </h2>
              <p className="text-muted-foreground mb-6">
                Discover how automation can transform your portable sanitation business, from scheduling 
                and routing to customer communication and billing. This comprehensive guide covers 
                everything you need to know to get started.
              </p>
              <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
                Read More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5"></div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for the latest industry insights and product updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}