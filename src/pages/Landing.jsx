import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Activity, Users, BarChart3, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export const Landing = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    navigate('/dashboard')
    return null
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  }

  const features = [
    { icon: Users, title: 'Team Management', description: 'Manage disciples, members, and players efficiently' },
    { icon: Activity, title: 'Event Tracking', description: 'Organize and monitor all events and programs' },
    { icon: BarChart3, title: 'Analytics', description: 'Track performance and engagement metrics' },
    { icon: Zap, title: 'Content Hub', description: 'Manage blogs and communications' },
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <nav className="relative z-10 flex justify-between items-center px-6 py-6 md:px-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Bold n Rooted
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          onClick={() => navigate('/login')}
          className="px-6 py-2 rounded-lg bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-semibold transition transform hover:scale-105"
        >
          Sign In
        </motion.button>
      </nav>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:px-12 md:py-32">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Admin Dashboard for{' '}
            <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Bold n Rooted</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8">Manage your community, teams, and content in one powerful platform</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-lg bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-semibold text-lg transition transform hover:scale-105"
          >
            Get Started
          </button>
          <button className="px-8 py-3 rounded-lg border-2 border-slate-400 hover:border-white hover:bg-white/10 font-semibold text-lg transition">
            Learn More
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/40 transition transform hover:-translate-y-2"
              whileHover={{ scale: 1.02 }}
            >
              <feature.icon className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="mt-16 p-8 rounded-2xl bg-linear-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-400/30">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-300 mb-6">Join thousands of community leaders managing their organizations efficiently.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-lg bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-semibold text-lg transition transform hover:scale-105"
          >
            Sign In Now
          </button>
        </motion.div>
      </motion.div>

      <footer className="relative z-10 text-center py-8 text-slate-400 border-t border-white/10">
        <p>&copy; 2024 Bold n Rooted. All rights reserved.</p>
      </footer>
    </div>
  )
}
