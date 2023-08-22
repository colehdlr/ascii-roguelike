import React, { Component } from 'react';
import Game from './Game';
import Menu from './Menu';
import './styles.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startGame: false,
    };
  }

  initiateGame = () => {
    this.setState({ startGame: true });
  };

  quitGame = () => {
    this.setState({ startGame: false });
  };

  render() {
    const { startGame } = this.state;

    return (
      <div id='container'>
        {startGame ? (
          <Game quitGame={this.quitGame} />
        ) : (
          <Menu initiateGame={this.initiateGame} />
        )}
      </div>
    );
  }
}

export default App;