import './App.css';
import { test } from './web3mail';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <button
          onClick={() => {
            test().catch(console.log);
          }}
        >
          TEST
        </button>
        <p>open the console to see logs</p>
      </header>
    </div>
  );
}

export default App;
