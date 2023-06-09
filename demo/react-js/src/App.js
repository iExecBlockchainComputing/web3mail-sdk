import { IExecWeb3mail } from '@iexec/web3mail';
import './App.css';

function App() {
  const connection = async () => {
    if (window.ethereum !== undefined) {
      const web3mail = new IExecWeb3mail(window.ethereum);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={connection}>Connection</button>
        <br />
        <br />
      </header>
    </div>
  );
}

export default App;
