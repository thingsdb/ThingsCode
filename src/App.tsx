import { Container } from '@radix-ui/themes';
import { WorkspaceLauncher, ConnectionOverlay } from './components';


const App = () => {
  return (
    <Container size="3" p="5" mt="9">
      <WorkspaceLauncher />
      <ConnectionOverlay />
    </Container>
  );
};

export default App;