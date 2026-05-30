import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Scanner from './pages/Scanner'
import ReportCard from './pages/ReportCard'
import Details from './pages/Details'
import Choose from './pages/Choose'
import CameraScan from './pages/CameraScan'
import BottomNav from './components/BottomNav'
import TopNav from './components/TopNav'
import ChatBot from './components/ChatBot'
import History from './pages/History'
import Community from './pages/Community'
import About from './pages/About'

function AppLayout({ children }) {
  return (
    <>
      <div className="top-nav-tablet-desktop">
        <TopNav />
      </div>
      {children}
      <BottomNav />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ChatBot />
      <Routes>
        {/* landing page — full width, no container constraint */}
        <Route path="/" element={<><div className="top-nav-tablet-desktop"><TopNav /></div><Landing /></>} />

        {/* top-level app screens with bottom nav */}
        <Route path="/history" element={<AppLayout><History /></AppLayout>} />
        <Route path="/community" element={<AppLayout><Community /></AppLayout>} />
        <Route path="/about" element={<AppLayout><About /></AppLayout>} />

        {/* scanner app — narrow mobile container */}
        <Route
          path="/app/*"
          element={
            <AppLayout>
              <div className="app-container">
                <Routes>
                  <Route path="/" element={<Scanner />} />
                  <Route path="choose" element={<Choose />} />
                  <Route path="report" element={<ReportCard />} />
                  <Route path="details" element={<Details />} />
                  <Route path="scan" element={<CameraScan />} />
                </Routes>
              </div>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
