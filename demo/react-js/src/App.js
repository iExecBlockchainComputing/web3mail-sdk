import { IExecWeb3Mail } from '@iexec/web3mail';
import './App.css';

function App() {
  const connection = async () => {
    if (window.ethereum !== undefined) {
      const web3Mail = new IExecWeb3Mail(window.ethereum);
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
