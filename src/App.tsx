import { useState } from 'react'
import JokeGenerator from './components/JokeGenerator'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <JokeGenerator />
    </div>
  )
}

export default App
