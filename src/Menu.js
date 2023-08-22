import React, { Component } from 'react';
import Typewriter from "./Typewriter";
import './styles.css';

// Import the menuMusic.wav file
import menuMusic from './music/menuMusic.wav';

class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioPlayer: new Audio(menuMusic),
      isContentVisible: false, // Track the visibility of the content
    };
  }

  componentDidMount() {
    // Add event listener for keydown event
    document.addEventListener("keydown", this.handleKeyPress);
  }

  componentWillUnmount() {
    // Remove event listener when the component is unmounted
    document.removeEventListener("keydown", this.handleKeyPress);
  }

  playMenuMusic = () => {
    const { audioPlayer } = this.state;
    // Set the loop attribute to true to make the audio play in a loop
    audioPlayer.loop = true;
    // Start playing the menu music
    audioPlayer.play();
    // Update the state to make the content visible
    this.setState({ isContentVisible: true });
  };

  stopMenuMusic = () => {
    const { audioPlayer } = this.state;
    // Pause and reset the audio player
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  };

  handleKeyPress = (event) => {
    // Check if the pressed key is the spacebar
    if (event.keyCode === 32) {
      // Call the initiateGame function when the spacebar is pressed
      if (!this.state.isContentVisible) {
        this.playMenuMusic();
      }
      else {
        this.props.initiateGame();
      }
    }
  };

  render() {
    const { initiateGame } = this.props;
    const { isContentVisible } = this.state; // Get the visibility state

    return (
      <div>
        {/* Render the content only if it's visible */}
        {isContentVisible && (
          <>
            <h1 id='title'>ASCII ROGUELIKE</h1>

            <button onClick={initiateGame} id='button' style={{ marginTop: '80px' }}>
              Play
            </button>
            <br />
            <button
              onClick={() => window.open('https://www.buymeacoffee.com/colehdlr', '_blank')}
              id='button'
              style={{
                marginTop: '200px',
                border: '0px',
                fontSize: '25px',
                textDecorationLine: 'underline',
                borderRadius: '15px',
              }}
            >
              Keep this game free!
            </button>
          </>
        )}
        {/* Render the "Start Menu Music" button only if content is not visible */}
        {!isContentVisible && (
          <button onClick={this.playMenuMusic} id='button' style={{marginTop: '20%'}}>
            <Typewriter text="Begin your journey..." delay={100} />
          </button>
        )}
      </div>
    );
  }
}

export default Menu;
