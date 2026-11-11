import { useEffect, useState } from 'react'
import { LoginScreen } from './login/LoginScreen'
import { DashboardScreen } from './student/dashboard/DashboardScreen'

const studentDashboardRoute = 'student/dashboard'

function isStudentDashboardHash(): boolean {
  const path = window.location.hash.replace(/^#\/?/, '')
  return path === studentDashboardRoute
}

function App(): React.JSX.Element {
  const [showDashboard, setShowDashboard] = useState(isStudentDashboardHash)

  useEffect(() => {
    const onHashChange = (): void => {
      setShowDashboard(isStudentDashboardHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (showDashboard) {
    return <DashboardScreen />
  }

  return <LoginScreen />
}

export default App
