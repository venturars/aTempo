import { useEffect, useState } from 'react'
import { LoginScreen } from './login/LoginScreen'
import { PanelScreen } from './panel/PanelScreen'
import { RegisterScreen } from './register/RegisterScreen'
import { DashboardScreen } from './student/dashboard/DashboardScreen'

function pathFromHash(): string {
  return window.location.hash.replace(/^#\/?/, '')
}

function App(): React.JSX.Element {
  const [path, setPath] = useState(pathFromHash)

  useEffect(() => {
    const onHashChange = (): void => {
      setPath(pathFromHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (path === 'teacher/panel') {
    return <PanelScreen />
  }

  if (path === 'student/dashboard') {
    return <DashboardScreen />
  }

  if (path === 'sign-up') {
    return <RegisterScreen />
  }

  return <LoginScreen />
}

export default App
