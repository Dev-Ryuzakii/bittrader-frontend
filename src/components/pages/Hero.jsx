import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  ArrowRight, 
  Play,
  CheckCircle,
  Star,
  Globe,
  Brain,
  Target,
  Award,
  Clock,
  DollarSign,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const Hero = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [counters, setCounters] = useState({
    users: 0,
    trades: 0,
    profit: 0
  });

  // Animated counters
  useEffect(() => {
    const animateCounters = () => {
      const targets = { users: 50000, trades: 2500000, profit: 15000000 };
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setCounters({
          users: Math.round(targets.users * progress),
          trades: Math.round(targets.trades * progress),
          profit: Math.round(targets.profit * progress)
        });

        if (step >= steps) {
          clearInterval(timer);
        }
      }, stepTime);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });

    const statsElement = document.getElementById('stats-section');
    if (statsElement) {
      observer.observe(statsElement);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Advanced Trading Analytics",
      description: "Real-time market analysis with AI-powered insights and professional-grade charting tools."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Level Security",
      description: "Your funds and data are protected with military-grade encryption and multi-layer security."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning-Fast Execution",
      description: "Execute trades in milliseconds with our ultra-low latency infrastructure."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Strategies",
      description: "Access to professional trading strategies powered by machine learning algorithms."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Markets Access",
      description: "Trade forex, stocks, crypto, commodities, and indices from a single platform."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Trading Community",
      description: "Connect with professional traders and copy successful strategies."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Professional Trader",
      avatar: "SJ",
      content: "Tradexas transformed my trading. The AI insights helped me increase my profits by 340% in just 6 months.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Investment Manager",
      avatar: "MC",
      content: "The best trading platform I've used. Real-time analytics and execution speed are unmatched.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Day Trader",
      avatar: "ER",
      content: "Finally, a platform that understands serious traders. The strategy lab is a game-changer.",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "Forever",
      description: "Perfect for beginners",
      features: [
        "Basic trading tools",
        "Real-time charts",
        "Community access",
        "Mobile app",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "For serious traders",
      features: [
        "Advanced analytics",
        "AI trading signals",
        "Strategy automation",
        "Priority support",
        "Risk management tools",
        "Custom indicators"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For institutions",
      features: [
        "White-label solution",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced reporting",
        "24/7 phone support"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Tradexas</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
              <button 
                onClick={() => window.location.href = '/signin'}
                className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => window.location.href = '/signup'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-4 py-2 rounded-lg transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="px-4 py-2 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-300 hover:text-white">Features</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-300 hover:text-white">Pricing</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-300 hover:text-white">Reviews</a>
              <a href="#contact" className="block px-3 py-2 text-gray-300 hover:text-white">Contact</a>
              <div className="pt-2 space-y-2">
                <button 
                  onClick={() => window.location.href = '/signin'}
                  className="w-full bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => window.location.href = '/signup'}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/10 border border-blue-600/20 rounded-full px-4 py-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">#1 Trading Platform 2024</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Trade Smarter with{' '}
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    AI-Powered
                  </span>{' '}
                  Insights
                </h1>
                <p className="text-xl text-gray-400 max-w-lg">
                  Join 50,000+ traders using our advanced platform to maximize profits with real-time analytics, 
                  automated strategies, and professional-grade tools.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => window.location.href = '/signup'}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Start Trading Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="border border-white hover:border-gray-500 px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-black flex items-center justify-center text-xs font-semibold">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">10,000+ active traders</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-400 ml-2">4.9/5 rating</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 backdrop-blur-sm border border-white">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Live Trading Dashboard</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Live</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-600/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-400">+$12,540</div>
                      <div className="text-sm text-gray-400">Today's P&L</div>
                    </div>
                    <div className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">87.3%</div>
                      <div className="text-sm text-gray-400">Win Rate</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { pair: 'EUR/USD', change: '+0.85%', profit: '+$1,240' },
                      { pair: 'GBP/USD', change: '+1.23%', profit: '+$890' },
                      { pair: 'BTC/USD', change: '+2.15%', profit: '+$2,150' }
                    ].map((trade, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white">
                        <div>
                          <div className="font-medium">{trade.pair}</div>
                          <div className="text-sm text-green-400">{trade.change}</div>
                        </div>
                        <div className="text-green-400 font-semibold">{trade.profit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 animate-bounce">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-3 animate-pulse">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">
                {counters.users.toLocaleString()}+
              </div>
              <div className="text-gray-400">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">
                {counters.trades.toLocaleString()}+
              </div>
              <div className="text-gray-400">Trades Executed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">
                ${counters.profit.toLocaleString()}+
              </div>
              <div className="text-gray-400">Total Profits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Dominate
              </span>{' '}
              the Markets
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Professional-grade trading tools and AI-powered insights to help you make smarter trading decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-900/50 rounded-2xl p-8 border border-white hover:border-white transition-colors group hover:bg-gray-900/70">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Professional
            </span>{' '}
            Traders
          </h2>
          <p className="text-xl text-gray-400 mb-16">
            See what our community of successful traders has to say
          </p>

          <div className="relative">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-white">
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                "{testimonials[activeTestimonial].content}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-semibold">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{testimonials[activeTestimonial].name}</div>
                  <div className="text-gray-400">{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTestimonial ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Trading Plan
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Start free and upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative rounded-2xl p-8 border transition-all hover:scale-105 ${
                plan.popular 
                  ? 'bg-gradient-to-b from-blue-600/10 to-purple-600/10 border-blue-500' 
                  : 'bg-gray-900/50 border-white hover:border-white'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                    : 'bg-gray-800 hover:bg-[#222222] text-white'
                }`}
                onClick={() => window.location.href = '/signup'}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Trading Journey
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of successful traders and start making smarter trading decisions today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/signup'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button className="border border-white hover:border-gray-500 px-8 py-4 rounded-lg font-semibold transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Tradexas</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The most advanced trading platform for professionals. Trade smarter with AI-powered insights and professional-grade tools.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-[#222222] rounded-lg flex items-center justify-center transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-[#222222] rounded-lg flex items-center justify-center transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Tradexas. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Hero