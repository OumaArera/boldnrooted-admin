import { motion, AnimatePresence } from 'framer-motion'
import { LogOut } from 'lucide-react'

export const Sidebar = ({ menuItems, activeMenu, setActiveMenu, mobileMenuOpen, setMobileMenuOpen, user, onLogout }) => {
  const handleMenuClick = (id) => {
    setActiveMenu(id)
    setMobileMenuOpen(false)
  }

  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: { x: -280, opacity: 0, transition: { duration: 0.3 } },
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden md:flex md:flex-col w-64 bg-white border-r border-slate-200 shadow-lg"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bold n Rooted
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-200 p-4 space-y-4">
          <div className="px-4 py-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 uppercase tracking-wider">Logged in as</p>
            <p className="font-semibold text-slate-900 truncate">{user?.full_name || 'User'}</p>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
            />

            {/* Mobile Menu */}
            <motion.aside
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-16 bottom-0 w-64 bg-white z-40 flex flex-col md:hidden shadow-xl"
            >
              {/* Menu Items */}
              <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeMenu === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* User Section */}
              <div className="border-t border-slate-200 p-4 space-y-4">
                <div className="px-4 py-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 uppercase tracking-wider">Logged in as</p>
                  <p className="font-semibold text-slate-900 truncate">{user?.email || 'User'}</p>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
