import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Menu, X, FileText, Users, Calendar, Heart, Users2, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import { Blogs } from '../components/pages/Blogs'
import { Disciples } from '../components/pages/Disciples'
import { Events } from '../components/pages/Events'
import { Members } from '../components/pages/Members'
import { Players } from '../components/pages/Players'
import { Programs } from '../components/pages/Programs'
import { DashboardHome } from '../components/pages/DashboardHome'

const menuItems = [
  { id: 'home', label: 'Dashboard', icon: Zap },
  { id: 'blogs', label: 'Blogs', icon: FileText },
  { id: 'disciples', label: 'Disciples', icon: Users2 },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'prayers', label: 'Prayer Requests', icon: Heart },
  { id: 'programs', label: 'Programs', icon: Zap },
]

export const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const renderPage = () => {
    switch (activeMenu) {
      case 'blogs':
        return <Blogs />
      case 'disciples':
        return <Disciples />
      case 'events':
        return <Events />
      case 'members':
        return <Members />
      case 'prayers':
        return <Players />
      case 'programs':
        return <Programs />
      default:
        return <DashboardHome user={user} setActiveMenu={setActiveMenu} />
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-4 py-4 z-40 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Bold n Rooted</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex h-screen pt-16 md:pt-0">
        {/* Sidebar */}
        <Sidebar
          menuItems={menuItems}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 overflow-auto"
        >
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </motion.main>
      </div>
    </div>
  )
}
