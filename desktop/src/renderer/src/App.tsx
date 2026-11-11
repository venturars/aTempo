import { LoginScreen } from './login/LoginScreen'
import { useLoginStore } from './login/loginStore'
import { OrganizationDashboardScreen } from './organization/OrganizationDashboardScreen'

function App(): React.JSX.Element {
  const submitted = useLoginStore((state) => state.submitted)

  return submitted === null ? <LoginScreen /> : <OrganizationDashboardScreen />
}

export default App
