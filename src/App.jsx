import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import MonkeyMode from './components/MonkeyMode';
import DebugStorage from './components/DebugStorage';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [targetAlgo, setTargetAlgo] = useState(null);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home setView={setCurrentView} setTargetAlgo={setTargetAlgo} />;
      case 'monkey':
        return <MonkeyMode targetAlgo={targetAlgo} />;
      default:
        return <Home setView={setCurrentView} setTargetAlgo={setTargetAlgo} />;
    }
  };

  return (
    <>
      <Layout currentView={currentView} setView={setCurrentView}>
        {renderView()}
      </Layout>
      <DebugStorage />
    </>
  );
}

export default App;
