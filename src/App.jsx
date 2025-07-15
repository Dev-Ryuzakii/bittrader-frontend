import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Hero from './components/pages/hero'
import SignIn from './components/auth/signin'
import SignUp from './components/auth/signup'

const App = () => {
  return (
   <Routes>
    <Route path='/' element={<Hero />} />
    <Route path='/signin' element={<SignIn />} />
    <Route path='/signup' element={<SignUp />} />
   </Routes>
  )
}

export default App