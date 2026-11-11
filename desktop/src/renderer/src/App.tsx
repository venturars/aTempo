import { LoginScreen } from './login/LoginScreen'
import { RegisterScreen } from './register/RegisterScreen'
import { screenFromSearch } from './screenFromSearch'

function App(): React.JSX.Element {
  const screen = screenFromSearch(window.location.search)

  if (screen === 'register') {
    return <RegisterScreen />
  }

  return <LoginScreen />
}

export default App
