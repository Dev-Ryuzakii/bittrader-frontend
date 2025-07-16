import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Hero from './components/pages/Hero'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import Dashboard from './components/pages/Dashboard'
import Research from './components/pages/Research'
import Analytics from './components/pages/Analytics'
import Settings from './components/pages/Settings'
import Support from './components/pages/Support'
import Sidebar from './components/UI/Sidebar'
import Navbar from './components/UI/Navbar'
import AnalystInsights from './components/pages/AnalystInsights'
import StrategyLab from './components/pages/StrategyLab'
import AccountAggregation from './components/pages/AccountAggregation'
import Community from './components/pages/Community'

const App = () => {
  // Check if we're on a protected route
  const isProtectedRoute = !['/', '/signin', '/signup'].includes(window.location.pathname);

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      {isProtectedRoute && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isProtectedRoute && <Navbar />}
        <main className={`flex-1 overflow-auto ${isProtectedRoute ? 'bg-[#0A0A0A]' : ''}`}>
          <Routes>
            <Route path='/' element={<Hero />} />
            <Route path='/signin' element={<SignIn />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/ai-assistant' element={<div>AI Assistant Page</div>} />
            <Route path='/analyst-insights' element={<AnalystInsights />} />
            <Route path='/strategy-lab' element={<StrategyLab />} />
            <Route path='/account-aggregation' element={<AccountAggregation />} />
            <Route path='/community' element={<Community />} />
            <Route path='/research' element={<Research />} />
            <Route path='/analytics' element={<Analytics />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/support' element={<Support />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App