import { LoginScreen } from './login/LoginScreen'
import { useLoginStore } from './login/loginStore'
import { PanelScreen } from './panel/PanelScreen'

function App(): React.JSX.Element {
  const submitted = useLoginStore((state) => state.submitted)

  if (submitted === null && !import.meta.env.DEV) {
    return <LoginScreen />
  }

  return <PanelScreen />
}

export default App
