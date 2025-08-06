import React, { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ConfirmProvider } from './contexts/ConfirmContext.jsx'
import { TradingSymbolProvider } from './contexts/TradingSymbolContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
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
import EnhancedAccountAggregation from './components/pages/EnhancedAccountAggregation'
import Community from './components/pages/Community'
import CardShowcase from './components/pages/CardShowcase'
import Transactions from './components/pages/Transactions'
import AI_Assistant from './components/pages/AI_Assistant.jsx'
import Search from './components/pages/Search.jsx'

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Check if we're on a public route
  const isPublicRoute = ['/', '/signin', '/signup'].includes(location.pathname);
  
  // Show sidebar and navbar only when authenticated and not on public routes
  const showNavigation = isAuthenticated && !isPublicRoute;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <TradingSymbolProvider>
          <div className="flex h-screen bg-[#0A0A0A]">
            {showNavigation && (
              <Sidebar 
                isMobileMenuOpen={isMobileMenuOpen} 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
              />
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              {showNavigation && (
                <Navbar 
                  isMobileMenuOpen={isMobileMenuOpen} 
                  setIsMobileMenuOpen={setIsMobileMenuOpen} 
                />
              )}
              <main className={`flex-1 overflow-auto ${showNavigation ? 'bg-[#0A0A0A]' : ''}`}>
                <Routes>
                  <Route path='/' element={<Hero />} />
                  <Route path='/signin' element={<SignIn />} />
                  <Route path='/signup' element={<SignUp />} />
                  <Route path='/dashboard' element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path='/ai-assistant' element={
                    <ProtectedRoute>
                      <AI_Assistant />
                    </ProtectedRoute>
                  } />
                  <Route path='/analyst-insights' element={
                    <ProtectedRoute>
                      <AnalystInsights />
                    </ProtectedRoute>
                  } />
                  <Route path='/strategy-lab' element={
                    <ProtectedRoute>
                      <StrategyLab />
                    </ProtectedRoute>
                  } />
                  <Route path='/account-aggregation' element={
                    <ProtectedRoute>
                      <EnhancedAccountAggregation />
                    </ProtectedRoute>
                  } />
                  <Route path='/community' element={
                    <ProtectedRoute>
                      <Community />
                    </ProtectedRoute>
                  } />
                  <Route path='/research' element={
                    <ProtectedRoute>
                      <Research />
                    </ProtectedRoute>
                  } />
                  <Route path='/analytics' element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path='/settings' element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path='/support' element={
                    <ProtectedRoute>
                      <Support />
                    </ProtectedRoute>
                  } />
                  <Route path='/card-showcase' element={
                    <ProtectedRoute>
                      <CardShowcase />
                    </ProtectedRoute>
                  } />
                  <Route path='/transactions' element={
                    <ProtectedRoute>
                      <Transactions />
                    </ProtectedRoute>
                  } />
                  <Route path='/search' element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
            </div>
          </div>
        </TradingSymbolProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App