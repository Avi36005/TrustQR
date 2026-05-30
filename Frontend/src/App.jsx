import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Scanner from './pages/Scanner'
import ReportCard from './pages/ReportCard'
import Details from './pages/Details'
import History from './pages/History'
import About from './pages/About'
import Choose from './pages/Choose'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* landing page — full width, no container constraint */}
        <Route path="/" element={<Landing />} />

        {/* scanner app — narrow mobile container */}
        <Route
          path="/app/*"
          element={
            <div className="app-container">
              <Routes>
                <Route path="/" element={<Scanner />} />
                <Route path="choose" element={<Choose />} />
                <Route path="report" element={<ReportCard />} />
                <Route path="details" element={<Details />} />
                <Route path="history" element={<History />} />
                <Route path="about" element={<About />} />
              </Routes>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
