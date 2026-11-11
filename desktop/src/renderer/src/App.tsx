import { LoginScreen } from './login/LoginScreen'
import { DashboardScreen } from './student/dashboard/DashboardScreen'

function App(): React.JSX.Element {
  if (import.meta.env.VITE_SCREEN === 'dashboard') {
    return <DashboardScreen />
  }

  return <LoginScreen />
}

export default App
