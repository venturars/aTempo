import { LoginScreen } from './login/LoginScreen'
import { RegisterScreen } from './register/RegisterScreen'
import { screenFromSearch } from './screenFromSearch'

const screens = {
  'sign in': LoginScreen,
  'sign up': RegisterScreen
} as const

function App(): React.JSX.Element {
  const screen = screenFromSearch(window.location.search)
  const Screen = screens[screen]

  return <Screen />
}

export default App
