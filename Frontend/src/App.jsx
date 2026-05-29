import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Scanner from './pages/Scanner'
import ReportCard from './pages/ReportCard'
import Details from './pages/Details'
import History from './pages/History'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Scanner />} />
          <Route path="/report" element={<ReportCard />} />
          <Route path="/details" element={<Details />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
