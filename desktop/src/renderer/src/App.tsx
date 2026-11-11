import { LoginScreen } from './login/LoginScreen'
import { RegisterScreen } from './register/RegisterScreen'

// The registration screen has no visible link yet. Tests open it with #registro.
function App(): React.JSX.Element {
  if (window.location.hash === '#registro') {
    return <RegisterScreen />
  }

  return <LoginScreen />
}

export default App
