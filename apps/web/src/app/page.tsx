'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Shield, Zap, Eye, Users, Award, ChevronDown, Sparkles, Activity, TrendingUp, Globe, Clock, CheckCircle, Star, Github, Twitter } from 'lucide-react';


function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

// Floating card animation
const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  
  const heroY = useSpring(0, {
    stiffness: 100,
    damping: 30
  });
  const heroOpacity = useSpring(1, {
    stiffness: 100,
    damping: 30
  });


  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Lock,
      title: "Fully Encrypted",
      description: "Every bid is encrypted end-to-end. Not even we can see your bid amounts until settlement.",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Eye,
      title: "No Front-Running",
      description: "Your transactions are protected from MEV bots and front-runners. Trade with confidence.",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Settlement happens in seconds, not minutes. Built on Solana.",
      color: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: Shield,
      title: "Mathematically Secure",
      description: "Built on zero-knowledge proofs. Your privacy is guaranteed by math, not promises.",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: Users,
      title: "Fair For Everyone",
      description: "Big or small, every participant gets equal treatment. No special privileges.",
      color: "from-indigo-500/20 to-purple-500/20"
    },
    {
      icon: Award,
      title: "True Price Discovery",
      description: "Vickrey auctions ensure you pay what it's worth, not a penny more.",
      color: "from-red-500/20 to-pink-500/20"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Connect & Create",
      description: "Connect your wallet and create an auction in seconds. Set your terms, no KYC needed.",
      icon: Globe
    },
    {
      number: "02", 
      title: "Bid Privately",
      description: "Submit encrypted bids. Nobody knows what you bid until the auction ends.",
      icon: Lock
    },
    {
      number: "03",
      title: "Win Fairly",
      description: "Winners are determined by smart contracts. Losers' bids stay private forever.",
      icon: CheckCircle
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white">
      <ParticleBackground />
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 z-0">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl" 
        />
      </div>

      <nav className="relative z-50 px-8 py-4 md:px-16 md:py-6 absolute top-0 left-0 right-0">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-lg opacity-50"
              />
              <img src="/logo.png" alt="Shadow Protocol" className="relative w-10 h-10 object-contain" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Shadow</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex items-center space-x-8"
          >
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all hover:scale-105">Features</a>
            <a href="#how" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all hover:scale-105">How it Works</a>
            <a href="/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-all hover:scale-105">Docs</a>
            <motion.a 
              href="/app" 
              className="relative px-6 py-2.5 text-sm font-semibold overflow-hidden rounded-full group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 group-hover:from-purple-700 group-hover:to-pink-700" />
              <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <span className="relative text-white flex items-center gap-2">
                Launch App <Sparkles className="w-4 h-4" />
              </span>
            </motion.a>
          </motion.div>
        </div>
      </nav>

      <section className="relative z-10 px-8 pt-20 pb-20 md:px-16 md:pt-24 md:pb-32 hero-container">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center hero-content">
            <motion.div 
              initial={{ scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center space-x-2 px-4 py-2 mb-8 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm rounded-full border border-purple-200/50"
            >
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Live on Devnet
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight mb-6"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Auctions that
              </span>
              <br />
              <motion.span 
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                actually work
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Private auctions with encrypted bids and secure settlement on Solana.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.a 
                href="/app" 
                className="group relative px-8 py-4 overflow-hidden rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <motion.span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{
                    background: [
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative text-white font-semibold flex items-center justify-center space-x-2">
                  <span>Start Trading</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.a>
              
              <motion.button
                className="group px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-full hover:border-purple-300 transition-all hover:shadow-lg hover:shadow-purple-200/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                  <span className="flex items-center justify-center space-x-2">
                    <Github className="w-5 h-5 text-gray-800" />
                    <span className="font-semibold text-gray-800">View on GitHub</span>
                  </span>
              </motion.button>
            </motion.div>

            {/* Live stats ticker */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-16 flex items-center justify-center space-x-8 text-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-600">Network: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Solana Devnet</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, ...floatingAnimation }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mt-20"
          >
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-8 py-20 md:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Built different. Built better.
            </h2>
            <p className="text-lg text-gray-600">Click any feature to learn more</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() => setActiveFeature(activeFeature === index ? null : index)}
                className="group relative p-8 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl hover:border-purple-300 transition-all cursor-pointer hover:shadow-xl hover:shadow-purple-200/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                
                <div className="relative">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-6 h-6 text-purple-600" />
                  </motion.div>
                  
                  <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <AnimatePresence>
                    {activeFeature === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <p className="text-xs text-gray-500">
                          Uses Arcium Network's Multi-Party Computation (MPC) technology
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Animations */}
      <section id="how" className="relative z-10 px-8 py-20 md:px-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Three steps to freedom
            </h2>
            <p className="text-lg text-gray-600">No paperwork. No waiting. No nonsense.</p>
          </motion.div>

          <div className="relative">
            {/* Animated connection line */}
            <motion.div
              className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative"
                >
                  <motion.div
                    animate={floatingAnimation}
                    transition={{ delay: index * 0.3 }}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <motion.div 
                      className="text-6xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-4"
                      animate={{ 
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ backgroundSize: "200% 200%" }}
                    >
                      {item.number}
                    </motion.div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon className="w-5 h-5 text-purple-600" />
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                    </div>
                    
                    <p className="text-gray-600">{item.description}</p>
                    
                    {index < 2 && (
                      <motion.div 
                        className="hidden md:block absolute top-12 -right-4 text-purple-300"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6" />
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section with Animated Background */}
      <section className="relative z-10 px-8 py-20 md:px-16 overflow-hidden">
        <motion.div
          className="absolute inset-0 -z-10"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ready to trade like it's 2030?
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-lg text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join thousands of traders already using Shadow Protocol.
            <br />
            Your competition doesn't want you to know about this.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a 
              href="/app" 
              className="group relative px-10 py-5 overflow-hidden rounded-full text-lg font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
              <motion.span
                className="absolute inset-0"
                animate={{
                  background: [
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                  ],
                  backgroundPosition: ["-200% 0%", "200% 0%"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="relative text-white flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Launch App Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.a>
            
            <motion.a
              href="https://twitter.com/shadowprotocol"
              className="group px-10 py-5 bg-white border-2 border-gray-200 rounded-full hover:border-purple-300 transition-all text-lg font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center justify-center space-x-2">
                <Twitter className="w-5 h-5 text-blue-500" />
                <span className='text-blue-900'>Follow Updates</span>
              </span>
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 md:px-16 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo.png" alt="Shadow Protocol" className="w-8 h-8 object-contain" />
                <span className="text-lg font-bold">Shadow Protocol</span>
              </div>
              <p className="text-sm text-gray-600">
                The future of private auctions on Solana.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2">
                <a href="/app" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Launch App</a>
                <a href="/docs" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Documentation</a>
                <a href="/docs/api-reference" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">API Reference</a>
                <a href="/docs/examples" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Examples</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Discord</a>
                <a href="#" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Twitter</a>
                <a href="#" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">GitHub</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Privacy Policy</a>
                <a href="#" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Terms of Service</a>
                <a href="#" className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-4 md:mb-0">
              © 2024 Shadow Protocol. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}