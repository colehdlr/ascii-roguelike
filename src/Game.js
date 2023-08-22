import React, { Component } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import './styles.css';
import mapJSON from'./maps.json';
import itemList from './items.json';

// TO DO:
/*
    -        Shifting lava
    - Add combat
    - Fix overflow of items
    -        Boulders
    - Max health < health?!
    - Active ability not showing shield?
    - Show how many poison tick on Ability select
    - Damage stat deals damages on turn w ability (poison continues e.g. 4+2, 2, 2)
    - Ability select edge case breaks game -> flute as first item
    -               Mana regen (single use)
    -               health regen (single use)
    - active bar along bottom (single use + cooldowns?)
    - info button for what icons mean
    - Add artwork to the menu
    -               Make ability select move rather than grey
    - Diagonal movement
*/


// Battle System Notes:
/*
  Types of ability: (abilityAffects:)
    "attack"
    "block"
    "manaRegen"
    "healthRegen"

  Special Circumstance:
    Some abilities require mana (manaCost:)
    Some abilities apply DoT (dot: turns) (applies damage from attack for multiple turns)
*/

class Game extends Component {
  state = {
    map: {
      id: 1,
      bottom: '',
      top: ''
    },
    player: {
      location: {
        direction: {
          x: 0,
          y: 0
        },
        wait: 0,
        x: 1,
        y: 1
      },
      stats: {
        maxHealth: 10,
        damage: 1,
        maxMana: 1,
        speed: 10
      },
      health: 10,
      burn: false,
      heal: false,
      items: [["Wooden Sword", "+1 Damage", 0]],
      activeItems: [0]
    },
    chest: {
      view: "",
      perk: "empty",
    },
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      tab: false
    },
    action: "game",
    menu: {
      resume: false,
      controls: false,
      quit: false,
      viewControls: false
    },
    vignetteLoaded: false,
    mouseOnAbility: -10
  }

  createMyItemsJson = () => {
    // Create a deep copy of items.json
    const itemsCopy = JSON.parse(JSON.stringify(itemList));
    const mapCopy = JSON.parse(JSON.stringify(mapJSON));

    // Remove the first item from itemsCopy
    itemsCopy.items.splice(0, 1);

    // Create myItems.json
    const myItemsJson = JSON.stringify(itemsCopy);
    const mapStorageJSON = JSON.stringify(mapCopy);

    localStorage.setItem('myItems', myItemsJson);
    localStorage.setItem('mapStorage', mapStorageJSON);
  };

  constructor(props) {
    super(props);
    // Vignette image loading
    this.vignette = new Image();
    this.vignette.src = process.env.PUBLIC_URL + "/vignette.png";
    this.vignette.onload = () => {
      this.setState(() => ({
        vignetteLoaded: true
      }));
    };
    this.vignetteR = new Image();
    this.vignetteR.src = process.env.PUBLIC_URL + "/vignetteRed.png";
    this.vignetteB = new Image();
    this.vignetteB.src = process.env.PUBLIC_URL + "/vignetteBlue.png";
    this.soundIcon = new Image();
    this.soundIcon.src = process.env.PUBLIC_URL + "/soundIcon.png";
    this.musicIcon = new Image();
    this.musicIcon.src = process.env.PUBLIC_URL + "/musicIcon.png";

    // Additional files
    this.attackIcon = new Image();
    this.attackIcon.src = process.env.PUBLIC_URL + "/icons/attack.png";

    this.blockEnemyIcon = new Image();
    this.blockEnemyIcon.src = process.env.PUBLIC_URL + "/icons/blockEnemy.png";

    this.blockSelfIcon = new Image();
    this.blockSelfIcon.src = process.env.PUBLIC_URL + "/icons/blockSelf.png";

    this.healthRegenIcon = new Image();
    this.healthRegenIcon.src = process.env.PUBLIC_URL + "/icons/healthRegen.png";

    this.manaCostIcon = new Image();
    this.manaCostIcon.src = process.env.PUBLIC_URL + "/icons/manaCost.png";

    this.manaRegenIcon = new Image();
    this.manaRegenIcon.src = process.env.PUBLIC_URL + "/icons/manaRegen.png";

    this.poison1Icon = new Image();
    this.poison1Icon.src = process.env.PUBLIC_URL + "/icons/poison1.png";

    this.poison2Icon = new Image();
    this.poison2Icon.src = process.env.PUBLIC_URL + "/icons/poison2.png";

    this.poison3Icon = new Image();
    this.poison3Icon.src = process.env.PUBLIC_URL + "/icons/poison3.png";

    this.poison4Icon = new Image();
    this.poison4Icon.src = process.env.PUBLIC_URL + "/icons/poison4.png";

    // Bind the event handler for the vignette image
    this.vignette.onload = this.vignette.onload.bind(this);
  }

  // Update the game loop to use time-based approach for 60fps
  gameLoop = (timestamp) => {
    if (!this.prevTimestamp) {
      this.prevTimestamp = timestamp;
    }

    // Calculate the time elapsed since the last frame in seconds
    const deltaTime = (timestamp - this.prevTimestamp) / 1000;

    if (this.state.action === "game") {
      // Code for game loop
      this.update(deltaTime); // Pass deltaTime to update method
      this.draw();
    } else if (this.state.action === "battle") {
      // Code for battle loop
      this.battleUpdate(deltaTime); // Pass deltaTime to battleUpdate method
      this.battleDraw();
    } else if (this.state.action === "menu") {
      // Code for menu loop
      this.menuDraw();
    } else if (this.state.action === "abilitySelect") {
      // Code for ability loop
      this.abilityDraw();
    }

    this.prevTimestamp = timestamp;
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // Method to cancel the animation frame when the component unmounts
  cancelAnimationFrame = () => {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  };

  componentDidMount() {
    // Set up event listeners for key presses and releases
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);

    // Call the draw function when the component mounts
    this.draw(); 

    // Duplicate item list
    this.createMyItemsJson();

    // Font setup
    const robotoMono = new FontFaceObserver('RobotoMono');
    robotoMono.load().then(() => {
        // Font is loaded, do something
        console.log("Font loaded successfully");
    });

    // Start game loop using requestAnimationFrame
    this.gameLoop();
  }

  componentWillUnmount() {
    // Clean up event listeners when the component is unmounted
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    if (this.handleMouseDown) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    }

    // Stop the game loop
    this.cancelAnimationFrame();
  }

  handleKeyDown = (event) => {
    // Update the key state when a key is pressed
    const { keys } = this.state;

    if (event.key === 'w' || event.key === 'ArrowUp') {
      keys.w = true;
    } else if (event.key === 'a' || event.key === 'ArrowLeft') {
      keys.a = true;
    } else if (event.key === 's' || event.key === 'ArrowDown') {
      keys.s = true;
    } else if (event.key === 'd' || event.key === 'ArrowRight') {
      keys.d = true;
    } if (event.key === 'Tab') {
      event.preventDefault();
      keys.tab = true;
    }

    if (event.key === 'Escape') {
      if (this.state.action === "menu") {
        if (this.state.menu.viewControls) {
          this.setState((prevState) => ({
            menu: {
              ...prevState.menu,
              viewControls: false
            }
          }));
        }
        else {
          this.setState(() => ({
            action: "game"
          }));
        }
        
      }
      else if (this.state.action === "game") {
        this.setState(() => ({
          action: "menu"
        }));
      }
    }

    if (event.key === 'e') {
      if (this.state.action === "game") {
        if (this.state.action !== "abilitySelect") {
          this.setState(() => ({
            action: "abilitySelect"
          }));
        }
        
      }
      else if (this.state.action === "abilitySelect"){
          this.setState(() => ({
            action: "game",
            mouseOnAbility: -10
          }));
        }
    }

    // Close popups
    if (this.state.chest.view !== "" && event.key === ' ') {
      this.setState((prevState) => ({
        chest: {
          view: ""
        }
      }));
    }

    this.setState({ keys });
  }

  handleKeyUp = (event) => {
    // Update the key state when a key is released
    const { keys } = this.state;

    if (event.key === 'w' || event.key === 'ArrowUp') {
      keys.w = false;
    } else if (event.key === 'a' || event.key === 'ArrowLeft') {
      keys.a = false;
    } else if (event.key === 's' || event.key === 'ArrowDown') {
      keys.s = false;
    } else if (event.key === 'd' || event.key === 'ArrowRight') {
      keys.d = false;
    } if (event.key === 'Tab') {
      keys.tab = false;
    } 

    this.setState({ keys });
  }

  openChest = () => {
    const myItemsJson = JSON.parse(localStorage.getItem('myItems'));
    var randomNum = Math.floor(Math.random() * myItemsJson.items.length);

    // Check JSON not empty
    if (myItemsJson.items.length === 0) {
      return "No items left!";
    }

    var healthChange = 0;
    var manaChange = 0;
    var damageChange = 0;
    var perkText = "empty";
  
    if (myItemsJson.items[randomNum].affects === "maxHealth") {
      healthChange = myItemsJson.items[randomNum].effect;
      perkText = "+" + myItemsJson.items[randomNum].effect + " Max Health";
    } else if (myItemsJson.items[randomNum].affects === "maxMana") {
      manaChange = myItemsJson.items[randomNum].effect;
      perkText = "+" + myItemsJson.items[randomNum].effect + " Max Mana";
    } else if (myItemsJson.items[randomNum].affects === "damage") {
      damageChange = myItemsJson.items[randomNum].effect;
      perkText = "+" + myItemsJson.items[randomNum].effect + " Damage";
    }
  
    if (perkText.charAt(1) === '-') {
      perkText = perkText.substring(1);
    }

    const contents = myItemsJson.items[randomNum].name;
    var index;

    for (var i = 0; i < itemList.items.length; i++) {
      if (itemList.items[i].name === contents) {
        index = i;
      }
    }

    // Remove the used item from myItemsJson
    myItemsJson.items.splice(randomNum, 1);
    localStorage.setItem('myItems', JSON.stringify(myItemsJson));
  
    // Update data
    this.setState((prevState) => ({
      player: {
        ...prevState.player,
        stats: {
            ...prevState.player.stats,
            maxHealth: prevState.player.stats.maxHealth + healthChange,
            maxMana: prevState.player.stats.maxMana + manaChange,
            damage: prevState.player.stats.damage + damageChange,
        },
        items: [...prevState.player.items, [contents, perkText, index]],
      },
      chest: {
        ...prevState.chest,
        perk: perkText,
      }
    }));
  
    return contents;
  };
  

  checkDirection = ([x, y]) => {
    const playerLoc = this.state.player.location;
    var burn = false;
    var heal = false;
    var openChest = this.state.chest.view;

    if (this.state.map.bottom[playerLoc.y + y][playerLoc.x + x] === "#") {
      // Handle collision
      x = 0;
      y = 0;
      burn = this.state.player.burn;
      heal = this.state.player.heal;
    } 
    else if (this.state.map.bottom[playerLoc.y + y][playerLoc.x + x] === "~") {
      burn = true;
    }
    else if (this.state.map.bottom[playerLoc.y + y][playerLoc.x + x] === "=") {
      heal = true;
    }
    else if (this.state.map.bottom[playerLoc.y + y][playerLoc.x + x] === "?") {
      openChest = this.openChest();

      // Remove chest from map
      /*
      let mapData = JSON.parse(localStorage.getItem("mapStorage"));
      const rowToUpdate = mapData.maps[0].design[playerLoc.y + y];
      mapData.maps[0].design[playerLoc.y + y] = rowToUpdate.substring(0, playerLoc.x + x) + " " + rowToUpdate.substring(playerLoc.x + x + 1);
      localStorage.setItem("mapStorage", JSON.stringify(mapData));
      */
    }
    else {
    }

    // Update data
    this.setState((prevState) => ({
      player: {
        ...prevState.player,
        location: {
          ...prevState.player.location,
          direction: {
            x: x,
            y: y
          },
          wait: 10,
          x: playerLoc.x + x,
          y: playerLoc.y + y,
        },
        burn: burn,
        heal: heal
      },
      chest: {
        ...prevState.chest,
        view: openChest
      }
    }));
    
  };

  // Add event listener to detect mouse movements
  handleMouseMove = (event) => {
    if (this.state.action === "menu" || this.state.player.health <= 0) {
      // Do menu update
      var resume = false;
      var controls = false;
      var quit = false;

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Check if the mouse is within the bounds of the Resume button
      if (
        mouseX >= (this.canvas.width - 275) / 2 &&
        mouseX <= (this.canvas.width + 305) / 2 &&
        mouseY >= 255 &&
        mouseY <= 339
      ) {
        resume = true;
      } else {
        resume = false;
      }

      // Check if the mouse is within the bounds of the Controls button
      if (
        mouseX >= (this.canvas.width - 275) / 2 &&
        mouseX <= (this.canvas.width + 305) / 2 &&
        mouseY >= 385 &&
        mouseY <= 469
      ) {
        controls = true;
      } else {
        controls = false;
      }

      // Check if the mouse is within the bounds of the Quit button
      if (
        mouseX >= (this.canvas.width - 275) / 2 &&
        mouseX <= (this.canvas.width + 305) / 2 &&
        mouseY >= 515 &&
        mouseY <= 599
      ) {
        quit = true;
      } else {
        quit = false;
      }

      this.setState((prevState) => ({
        menu: {
          ...prevState.menu,
          resume: resume,
          controls: controls,
          quit: quit
        },
      }));
    }

    if (this.state.action === "abilitySelect") {
      var mouseOnAbility = -10;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
    
      // Check if the mouse is inside Ability 1
      if (
        mouseX >= (this.canvas.width - 330) / 2 &&
        mouseX <= (this.canvas.width - 130) / 2 &&
        mouseY >= 204 &&
        mouseY <= 288
      ) {
        mouseOnAbility = -1;
      }
      // Check if the mouse is inside Ability 2
      else if (
        mouseX >= (this.canvas.width - 85) / 2 &&
        mouseX <= (this.canvas.width + 115) / 2 &&
        mouseY >= 204 &&
        mouseY <= 288
      ) {
        mouseOnAbility = -2;
      }
      // Check if the mouse is inside Ability 3
      else if (
        mouseX >= (this.canvas.width + 157) / 2 &&
        mouseX <= (this.canvas.width + 357) / 2 &&
        mouseY >= 204 &&
        mouseY <= 288
      ) {
        mouseOnAbility = -3;
      } else {
        // Check if the mouse is inside any inventory slot
        for (var j = 0; j < Math.ceil(this.state.player.items.length / 5); j++) {

          if (j < (Math.ceil(this.state.player.items.length / 5 - 1)) || (this.state.player.items.length%5 === 0 && this.state.player.items.length !== 0)) {
            for (var i = 0; i < 5; i++) {
              if (
                mouseX >= (this.canvas.width - 811 + 242 * (i + 1)) / 2 &&
                mouseX <= (this.canvas.width - 611 + 242 * (i + 1)) / 2 &&
                mouseY >= 334 + 106 * j &&
                mouseY <= 418 + 106 * j
              ) {
                mouseOnAbility = j * 5 + i;
                break;
              }
            }
          }
          else {
            // eslint-disable-next-line
            for (var i = 0; i < this.state.player.items.length%5; i++) {
              if (
                mouseX >= (this.canvas.width - 811 + 242 * (i + 1)) / 2 &&
                mouseX <= (this.canvas.width - 611 + 242 * (i + 1)) / 2 &&
                mouseY >= 334 + 106 * j &&
                mouseY <= 418 + 106 * j
              ) {
                mouseOnAbility = j * 5 + i;
                break;
              }
            }
          }
          
        }
      }

      this.setState(() => ({
        mouseOnAbility: mouseOnAbility
      }));
    }    
  };

  // Add event listener to detect mouse down
  handleMouseDown = (event) => {
    if (this.state.action === "menu" || this.state.player.health <= 0) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Check if the mouse is within the bounds of the Resume button
      if (
        mouseX >= (this.canvas.width - 275) / 2 &&
        mouseX <= (this.canvas.width + 305) / 2 &&
        mouseY >= 255 &&
        mouseY <= 339 &&
        !this.state.menu.viewControls
      ) {
        this.setState(() => ({
          action: "game"
        }));
      }

      
      // Check if the mouse is within the bounds of the Controls button
      if (
        mouseX >= (this.canvas.width - 275) / 2 &&
        mouseX <= (this.canvas.width + 305) / 2 &&
        mouseY >= 385 &&
        mouseY <= 469 &&
        !this.state.menu.viewControls
      ) {
        this.setState((prevState) => ({
          menu: {
            ...prevState.menu,
            viewControls: true
          }
        }));
      }
      

      // Check if the mouse is within the bounds of the Quit button
      if (
        mouseX >= (this.canvas.width - 275) / 2 &&
        mouseX <= (this.canvas.width + 305) / 2 &&
        mouseY >= 515 &&
        mouseY <= 599 &&
        !this.state.menu.viewControls
      ) {
        window.location.reload();
      }
      
    }
    else if (this.state.action === "abilitySelect") {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Check if the mouse is inside Ability 1
      if (
        mouseX >= (this.canvas.width - 330) / 2 &&
        mouseX <= (this.canvas.width - 130) / 2 &&
        mouseY >= 204 &&
        mouseY <= 288
      ) {
        this.setState((prevState) => ({
          player: {
            ...prevState.player,
            activeItems: prevState.player.activeItems ? [null, ...prevState.player.activeItems.slice(1)] : [null]
          }
        }));
      }
      // Check if the mouse is inside Ability 2
      else if (
        mouseX >= (this.canvas.width - 85) / 2 &&
        mouseX <= (this.canvas.width + 115) / 2 &&
        mouseY >= 204 &&
        mouseY <= 288
      ) {
        this.setState((prevState) => ({
          player: {
            ...prevState.player,
            activeItems: [
              prevState.player.activeItems[0], // Keep the first element as it is
              null,                           // Set the second element to null
              ...(prevState.player.activeItems.slice(2)) // Include the rest of the elements from index 2
            ]
          }
        }));
      }
      // Check if the mouse is inside Ability 3
      else if (
        mouseX >= (this.canvas.width + 157) / 2 &&
        mouseX <= (this.canvas.width + 357) / 2 &&
        mouseY >= 204 &&
        mouseY <= 288
      ) {
        this.setState((prevState) => ({
          player: {
            ...prevState.player,
            activeItems: [
              prevState.player.activeItems[0], // Keep the first element as it is
              prevState.player.activeItems[1], // Keep the second element as it is
              null,                           // Set the third element to null
              ...(prevState.player.activeItems.slice(3)) // Include the rest of the elements from index 3
            ]
          }
        }));        
      } else {
        // Check if the mouse is inside any inventory slot
        for (var j = 0; j < Math.ceil(this.state.player.items.length / 5); j++) {

          if (j < (Math.ceil(this.state.player.items.length / 5 - 1)) || (this.state.player.items.length%5 === 0 && this.state.player.items.length !== 0)) {
            for (var i = 0; i < 5; i++) {
              
              const indexNum = this.state.player.items[i + 5*j][2];
              if (
                mouseX >= (this.canvas.width - 811 + 242 * (i + 1)) / 2 &&
                mouseX <= (this.canvas.width - 611 + 242 * (i + 1)) / 2 &&
                mouseY >= 334 + 106 * j &&
                mouseY <= 418 + 106 * j
              ) {
                if (!this.state.player.activeItems.includes(indexNum)) {
                  if (this.state.player.activeItems[0] == null) {
                    this.setState((prevState) => ({
                      player: {
                        ...prevState.player,
                        activeItems: prevState.player.activeItems ? [indexNum, ...prevState.player.activeItems.slice(1)] : [null]
                      }
                    }));
                  }
                  else if (this.state.player.activeItems[1] == null) {
                    this.setState((prevState) => ({
                      player: {
                        ...prevState.player,
                        activeItems: [
                          prevState.player.activeItems[0], // Keep the first element as it is
                          indexNum,                           // Set the second element to indexNum
                          ...(prevState.player.activeItems.slice(2)) // Include the rest of the elements from index 2
                        ]
                      }
                    }));
                  }
                  else if (this.state.player.activeItems[2] == null) {
                    this.setState((prevState) => ({
                      player: {
                        ...prevState.player,
                        activeItems: [
                          prevState.player.activeItems[0], // Keep the first element as it is
                          prevState.player.activeItems[1], // Keep the second element as it is
                          indexNum,                           // Set the third element to indexNum
                          ...(prevState.player.activeItems.slice(3)) // Include the rest of the elements from index 3
                        ]
                      }
                    }));    
                  }
                }
                
                break;
              }
            }
          }
          else {
            // eslint-disable-next-line
            for (var i = 0; i < this.state.player.items.length%5; i++) {
              
              const indexNum = this.state.player.items[i + 5*j][2];
              if (
                mouseX >= (this.canvas.width - 811 + 242 * (i + 1)) / 2 &&
                mouseX <= (this.canvas.width - 611 + 242 * (i + 1)) / 2 &&
                mouseY >= 334 + 106 * j &&
                mouseY <= 418 + 106 * j
              ) {
                if (!this.state.player.activeItems.includes(indexNum)) {
                  if (this.state.player.activeItems[0] == null) {
                    this.setState((prevState) => ({
                      player: {
                        ...prevState.player,
                        activeItems: prevState.player.activeItems ? [indexNum, ...prevState.player.activeItems.slice(1)] : [null]
                      }
                    }));
                  }
                  else if (this.state.player.activeItems[1] == null) {
                    this.setState((prevState) => ({
                      player: {
                        ...prevState.player,
                        activeItems: [
                          prevState.player.activeItems[0], // Keep the first element as it is
                          indexNum,                           // Set the second element to indexNum
                          ...(prevState.player.activeItems.slice(2)) // Include the rest of the elements from index 2
                        ]
                      }
                    }));
                  }
                  else if (this.state.player.activeItems[2] == null) {
                    this.setState((prevState) => ({
                      player: {
                        ...prevState.player,
                        activeItems: [
                          prevState.player.activeItems[0], // Keep the first element as it is
                          prevState.player.activeItems[1], // Keep the second element as it is
                          indexNum,                           // Set the third element to indexNum
                          ...(prevState.player.activeItems.slice(3)) // Include the rest of the elements from index 3
                        ]
                      }
                    }));    
                  }
                }
                
                break;
              }
            }
          }

          
        }
      }
    }
  };

  menuDraw = () => {
    // Do menu draw
    const ctx = this.canvas.getContext("2d");

    // ADD SOME ARTWORK TO THE BACK
    ctx.drawImage(this.vignette, 0, 0, this.canvas.width, this.canvas.height);
  
    // Font setup
    var fontSize = 35;
    ctx.font = fontSize + "px robotoMono";
  
    if (!this.state.menu.viewControls) {
      // Box
      ctx.fillStyle = "white";
      ctx.fillRect((this.canvas.width - 480)/2, 90, 480, 300 + 5*65);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width - 476)/2, 92, 476, 296 + 5*65);

      // Game paused
      ctx.fillStyle = "white";
      ctx.fillText("Game Paused", (this.canvas.width - 230)/2, 150);

      ctx.fillRect((this.canvas.width - 416)/2, 182, 416, 2);
      fontSize = 30;
      ctx.font = fontSize + "px robotoMono";

      if (this.state.menu.resume) {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 285)/2, 250, 290, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 281)/2, 252, 286, 80);
        ctx.fillStyle = "black";
        ctx.fillText("Resume", (this.canvas.width - 104)/2, 303);
      }
      else {
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 285)/2, 250, 290, 84);
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 281)/2, 252, 286, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Resume", (this.canvas.width - 104)/2, 303);
      }

      if (this.state.menu.controls) {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 285)/2, 380, 290, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 281)/2, 382, 286, 80);
        ctx.fillStyle = "black";
        ctx.fillText("Controls", (this.canvas.width - 138)/2, 433);
      }
      else {
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 285)/2, 380, 290, 84);
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 281)/2, 382, 286, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Controls", (this.canvas.width - 138)/2, 433);
      }

      if (this.state.menu.quit) {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 285)/2, 510, 290, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 281)/2, 512, 286, 80);
        ctx.fillStyle = "black";
        ctx.fillText("Quit", (this.canvas.width - 74)/2, 563);
      }
      else {
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 285)/2, 510, 290, 84);
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 281)/2, 512, 286, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Quit", (this.canvas.width - 74)/2, 563);
      }

      ctx.drawImage(this.soundIcon, (this.canvas.width - 168)/2, 645, 30, 30);
      ctx.drawImage(this.musicIcon, (this.canvas.width + 112)/2, 645, 30, 30);
    }
    else {
      // Box
      ctx.fillStyle = "white";
      ctx.fillRect((this.canvas.width - 580)/2, 90, 580, 300 + 5*65);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width - 576)/2, 92, 576, 296 + 5*65);

      // Controls
      ctx.fillStyle = "white";
      ctx.fillText("Controls", (this.canvas.width - 164)/2, 150);

      ctx.fillRect((this.canvas.width - 416)/2, 182, 416, 2);
      fontSize = 25;
      ctx.font = fontSize + "px robotoMono";

      // Info
      ctx.fillText("Movement: [WASD] / [ARROWS]", (this.canvas.width - 400)/2, 253);
      ctx.fillText("View Stats: [TAB]", (this.canvas.width - 260)/2, 308);
      ctx.fillText("Select Abilities: [E]", (this.canvas.width - 315)/2, 363);
    }
  }

  abilityDraw = () => {
    // Do ability draw
    const ctx = this.canvas.getContext("2d");

    // ADD SOME ARTWORK TO THE BACK
    ctx.drawImage(this.vignette, 0, 0, this.canvas.width, this.canvas.height);

    // Box
    ctx.fillStyle = "white";
    ctx.fillRect((this.canvas.width - 780)/2, 90, 780, 300 + 5*65);
    ctx.fillStyle = "black";
    ctx.fillRect((this.canvas.width - 776)/2, 92, 776, 296 + 5*65);

    // Font setup
    var fontSize = 30;
    ctx.font = fontSize + "px robotoMono";
    ctx.fillStyle = "white";
    ctx.fillText("Ability Select", (this.canvas.width - 258)/2, 150);

    ctx.fillRect((this.canvas.width - 416)/2, 182, 416, 2);

    fontSize = 15;
    ctx.font = fontSize + "px robotoMono";
    // Selected
    // Ability 1
    if (this.state.mouseOnAbility !== -1) {
      ctx.fillStyle = `rgb(0,255,0)`;
      ctx.fillRect((this.canvas.width - 337)/2, 199, 100, 84);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width - 333)/2, 201, 96, 80);

      ctx.fillStyle = "white";
      if (this.state.player.activeItems[0] != null) {
        ctx.fillText(itemList.items[this.state.player.activeItems[0]].abilityText, (this.canvas.width - 318)/2, 222, 80);
        
        // Mana
        if (itemList.items[this.state.player.activeItems[0]].manaCost !== 0) {
          ctx.fillText(itemList.items[this.state.player.activeItems[0]].manaCost, (this.canvas.width - 305)/2, 270, 80)
          ctx.drawImage(this.manaCostIcon, (this.canvas.width - 277)/2, 255, 15, 20);
        }
        // Poison
        if (itemList.items[this.state.player.activeItems[0]].dot > 0) {
          ctx.fillText(itemList.items[this.state.player.activeItems[0]].dot, (this.canvas.width - 229)/2, 270, 80)
          ctx.drawImage(this.poison1Icon, (this.canvas.width - 200)/2, 255, 15, 20);
        }
        // Attack
        else if (itemList.items[this.state.player.activeItems[0]].abilityType === "attack") {
          ctx.fillText(itemList.items[this.state.player.activeItems[0]].abilityEffect, (this.canvas.width - 229)/2, 270, 80)
          ctx.drawImage(this.attackIcon, (this.canvas.width - 200)/2, 255, 15, 20);
        }
        // Mana Regen
        else if (itemList.items[this.state.player.activeItems[0]].abilityType === "manaRegen") {
          ctx.fillText(itemList.items[this.state.player.activeItems[0]].abilityEffect, (this.canvas.width - 229)/2, 270, 80)
          ctx.drawImage(this.manaRegenIcon, (this.canvas.width - 200)/2, 255, 15, 17);
        }
        // Health Regen
        else if (itemList.items[this.state.player.activeItems[0]].abilityType === "healthRegen") {
          ctx.fillText(itemList.items[this.state.player.activeItems[0]].abilityEffect, (this.canvas.width - 229)/2, 270, 80)
          ctx.drawImage(this.healthRegenIcon, (this.canvas.width - 200)/2, 255, 15, 17);
        } 
        // Block Enemy
        else if (itemList.items[this.state.player.activeItems[0]].abilityType === "block" && itemList.items[this.state.player.activeItems[0]].abilityEffect === "enemy") {
          ctx.drawImage(this.blockEnemyIcon, (this.canvas.width - 200)/2, 253, 15, 20);
        }
        // Block Self
        else if (itemList.items[this.state.player.activeItems[0]].abilityType === "block" && itemList.items[this.state.player.activeItems[0]].abilityEffect === "self") {
          ctx.drawImage(this.blockSelfIcon, (this.canvas.width - 200)/2, 253, 15, 20);
        }
      }
      else {
        ctx.fillText("Select", (this.canvas.width - 290)/2, 235);
        ctx.fillText("Ability", (this.canvas.width - 301)/2, 255);
      }
    }
    else {
      if (this.state.player.activeItems[0] != null) {
          // REMOVE BUTTON
          ctx.fillStyle = "white";
          ctx.fillRect((this.canvas.width - 337)/2, 199, 100, 84);
          ctx.fillStyle = `rgb(255, 0, 0)`;
          ctx.fillRect((this.canvas.width - 333)/2, 201, 96, 80);
          ctx.fillStyle = "white";
          ctx.fillText("Remove", (this.canvas.width - 290)/2, 235);
      }
      else {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 337)/2, 199, 100, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 333)/2, 201, 96, 80);
        ctx.fillStyle = "black";
        ctx.fillText("Select", (this.canvas.width - 290)/2, 235);
        ctx.fillText("Ability", (this.canvas.width - 301)/2, 255);
      }
    }
    // Ability 2
    if (this.state.mouseOnAbility !== -2) {
      ctx.fillStyle = `rgb(0,255,0)`;
      ctx.fillRect((this.canvas.width - 95)/2, 199, 100, 84);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width - 91)/2, 201, 96, 80);

      ctx.fillStyle = "white";
      if (this.state.player.activeItems[1] != null) {
        ctx.fillText(itemList.items[this.state.player.activeItems[1]].abilityText, (this.canvas.width - 72)/2, 222, 80);
        
        // Mana
        if (itemList.items[this.state.player.activeItems[1]].manaCost !== 0) {
          ctx.fillText(itemList.items[this.state.player.activeItems[1]].manaCost, (this.canvas.width - 63)/2, 270, 80)
          ctx.drawImage(this.manaCostIcon, (this.canvas.width - 35)/2, 255, 15, 20);
        }
        // Poison
        if (itemList.items[this.state.player.activeItems[1]].dot > 0) {
          ctx.fillText(itemList.items[this.state.player.activeItems[1]].dot, (this.canvas.width + 13)/2, 270, 80)
          ctx.drawImage(this.poison1Icon, (this.canvas.width + 42)/2, 255, 15, 20);
        }
        // Attack
        else if (itemList.items[this.state.player.activeItems[1]].abilityType === "attack") {
          ctx.fillText(itemList.items[this.state.player.activeItems[1]].abilityEffect, (this.canvas.width + 13)/2, 270, 80)
          ctx.drawImage(this.attackIcon, (this.canvas.width + 42)/2, 255, 15, 20);
        }
        // Mana Regen
        else if (itemList.items[this.state.player.activeItems[1]].abilityType === "manaRegen") {
          ctx.fillText(itemList.items[this.state.player.activeItems[1]].abilityEffect, (this.canvas.width + 13)/2, 270, 80)
          ctx.drawImage(this.manaRegenIcon, (this.canvas.width + 42)/2, 255, 15, 17);
        }
        // Health Regen
        else if (itemList.items[this.state.player.activeItems[1]].abilityType === "healthRegen") {
          ctx.fillText(itemList.items[this.state.player.activeItems[1]].abilityEffect, (this.canvas.width + 13)/2, 270, 80)
          ctx.drawImage(this.healthRegenIcon, (this.canvas.width + 42)/2, 255, 15, 17);
        } 
        // Block Enemy
        else if (itemList.items[this.state.player.activeItems[1]].abilityType === "block" && itemList.items[this.state.player.activeItems[1]].abilityEffect === "enemy") {
          ctx.drawImage(this.blockEnemyIcon, (this.canvas.width + 42)/2, 253, 15, 20);
        }
        // Block Self
        else if (itemList.items[this.state.player.activeItems[1]].abilityType === "block" && itemList.items[this.state.player.activeItems[1]].abilityEffect === "self") {
          ctx.drawImage(this.blockSelfIcon, (this.canvas.width + 42)/2, 253, 15, 20);
        }
      }
      else {
        ctx.fillStyle = "white";
        ctx.fillText("Select", (this.canvas.width - 48)/2, 235);
        ctx.fillText("Ability", (this.canvas.width - 51)/2, 255);
      }
    }
    else {
      
      if (this.state.player.activeItems[1] != null) {
        // REMOVE BUTTON
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 95)/2, 199, 100, 84);
        ctx.fillStyle = `rgb(255, 0, 0)`;
        ctx.fillRect((this.canvas.width - 91)/2, 201, 96, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Remove", (this.canvas.width - 48)/2, 235);
      }
      else {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 95)/2, 199, 100, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 91)/2, 201, 96, 80);

        ctx.fillStyle = "black";
        ctx.fillText("Select", (this.canvas.width - 48)/2, 235);
        ctx.fillText("Ability", (this.canvas.width - 51)/2, 255);
      }
    }
    // Ability 3
    if (this.state.mouseOnAbility !== -3) {
      ctx.fillStyle = `rgb(0,255,0)`;
      ctx.fillRect((this.canvas.width + 147)/2, 199, 100, 84);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width + 151)/2, 201, 96, 80);

      ctx.fillStyle = "white";
      if (this.state.player.activeItems[2] != null) {
        ctx.fillText(itemList.items[this.state.player.activeItems[2]].abilityText, (this.canvas.width + 170)/2, 222, 80);
        
        // Mana
        if (itemList.items[this.state.player.activeItems[2]].manaCost !== 0) {
          ctx.fillText(itemList.items[this.state.player.activeItems[2]].manaCost, (this.canvas.width + 179)/2, 270, 80)
          ctx.drawImage(this.manaCostIcon, (this.canvas.width + 203)/2, 255, 15, 20);
        }
        // Poison
        if (itemList.items[this.state.player.activeItems[2]].dot > 0) {
          ctx.fillText(itemList.items[this.state.player.activeItems[2]].dot, (this.canvas.width + 255)/2, 270, 80)
          ctx.drawImage(this.poison1Icon, (this.canvas.width + 284)/2, 255, 15, 20);
        }
        // Attack
        else if (itemList.items[this.state.player.activeItems[2]].abilityType === "attack") {
          ctx.fillText(itemList.items[this.state.player.activeItems[2]].abilityEffect, (this.canvas.width + 255)/2, 270, 80)
          ctx.drawImage(this.attackIcon, (this.canvas.width + 284)/2, 255, 15, 20);
        }
        // Mana Regen
        else if (itemList.items[this.state.player.activeItems[2]].abilityType === "manaRegen") {
          ctx.fillText(itemList.items[this.state.player.activeItems[2]].abilityEffect, (this.canvas.width + 255)/2, 270, 80)
          ctx.drawImage(this.manaRegenIcon, (this.canvas.width + 284)/2, 255, 15, 17);
        }
        // Health Regen
        else if (itemList.items[this.state.player.activeItems[2]].abilityType === "healthRegen") {
          ctx.fillText(itemList.items[this.state.player.activeItems[2]].abilityEffect, (this.canvas.width + 255)/2, 270, 80)
          ctx.drawImage(this.healthRegenIcon, (this.canvas.width + 284)/2, 255, 15, 17);
        } 
        // Block Enemy
        else if (itemList.items[this.state.player.activeItems[2]].abilityType === "block" && itemList.items[this.state.player.activeItems[2]].abilityEffect === "enemy") {
          ctx.drawImage(this.blockEnemyIcon, (this.canvas.width + 284)/2, 253, 15, 20);
        }
        // Block Self
        else if (itemList.items[this.state.player.activeItems[2]].abilityType === "block" && itemList.items[this.state.player.activeItems[2]].abilityEffect === "self") {
          ctx.drawImage(this.blockSelfIcon, (this.canvas.width + 284)/2, 253, 15, 20);
        }

      }
      else {
        ctx.fillText("Select", (this.canvas.width + 194)/2, 235);
        ctx.fillText("Ability", (this.canvas.width + 183)/2, 255);
      }
    }
    else {
      
      if (this.state.player.activeItems[2] != null) {
        // REMOVE BUTTON
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width + 147)/2, 199, 100, 84);
        ctx.fillStyle = `rgb(255, 0, 0)`;
        ctx.fillRect((this.canvas.width + 151)/2, 201, 96, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Remove", (this.canvas.width + 194)/2, 235);
      }
      else {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width + 147)/2, 199, 100, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width + 151)/2, 201, 96, 80);
        ctx.fillStyle = "black";

        ctx.fillText("Select", (this.canvas.width + 194)/2, 235);
        ctx.fillText("Ability", (this.canvas.width + 183)/2, 255);
      }
    }

    // Inventory
    ctx.fillStyle = "white";
    ctx.fillRect((this.canvas.width - 620)/2, 300, 620, 2);

    for (var j = 0; j < Math.ceil(this.state.player.items.length/5); j++) {
      if (5*(j+1) <= this.state.player.items.length) {
        for (var i = 5*(j); i < 5*(j + 1); i++) {
          if (this.state.mouseOnAbility !== i) {
            ctx.fillStyle = "white";
            ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            ctx.fillStyle = "black";
            ctx.fillRect((this.canvas.width - 817 + 242*(i%5+1))/2, 331 + 106*j, 96, 80);
            ctx.fillStyle = "white";
            ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityText, (this.canvas.width - 805 + 242*(i%5+1))/2, 350 + 106*j, 80);
            // Mana
            if (itemList.items[this.state.player.items[i][2]].manaCost !== 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].manaCost, (this.canvas.width - 792 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaCostIcon, (this.canvas.width - 766 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Poison
            if (itemList.items[this.state.player.items[i][2]].dot > 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].dot, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.poison1Icon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Attack
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "attack") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.attackIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Mana Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "manaRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            }
            // Health Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "healthRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.healthRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            } 
            // Block Enemy
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "enemy") {
              ctx.drawImage(this.blockEnemyIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }
            // Block Self
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "self") {
              ctx.drawImage(this.blockSelfIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }

            if (this.state.player.activeItems.includes(this.state.player.items[i][2])) {
              ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;
              ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            }
            
          }
          else {
            ctx.fillStyle = "black";
            ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            ctx.fillStyle = "white";
            ctx.fillRect((this.canvas.width - 817 + 242*(i%5+1))/2, 331 + 106*j, 96, 80);
            ctx.fillStyle = "black";
            ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityText, (this.canvas.width - 805 + 242*(i%5+1))/2, 350 + 106*j, 80);
            // Mana
            if (itemList.items[this.state.player.items[i][2]].manaCost !== 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].manaCost, (this.canvas.width - 792 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaCostIcon, (this.canvas.width - 766 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Poison
            if (itemList.items[this.state.player.items[i][2]].dot > 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].dot, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.poison1Icon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Attack
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "attack") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.attackIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Mana Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "manaRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            }
            // Health Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "healthRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.healthRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            } 
            // Block Enemy
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "enemy") {
              ctx.drawImage(this.blockEnemyIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }
            // Block Self
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "self") {
              ctx.drawImage(this.blockSelfIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }

            if (this.state.player.activeItems.includes(this.state.player.items[i][2])) {
              ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;
              ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            }
          }
        }
      }
      else {
        // eslint-disable-next-line
        for (var i = 5*(j); i < this.state.player.items.length; i++) {
          if (this.state.mouseOnAbility !== i) {
            ctx.fillStyle = "white";
            ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            ctx.fillStyle = "black";
            ctx.fillRect((this.canvas.width - 817 + 242*(i%5+1))/2, 331 + 106*j, 96, 80);
            ctx.fillStyle = "white";
            ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityText, (this.canvas.width - 805 + 242*(i%5+1))/2, 350 + 106*j, 80);
            // Mana
            if (itemList.items[this.state.player.items[i][2]].manaCost !== 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].manaCost, (this.canvas.width - 792 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaCostIcon, (this.canvas.width - 766 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Poison
            if (itemList.items[this.state.player.items[i][2]].dot > 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].dot, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.poison1Icon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Attack
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "attack") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.attackIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Mana Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "manaRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            }
            // Health Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "healthRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.healthRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            } 
            // Block Enemy
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "enemy") {
              ctx.drawImage(this.blockEnemyIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }
            // Block Self
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "self") {
              ctx.drawImage(this.blockSelfIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }

            if (this.state.player.activeItems.includes(this.state.player.items[i][2])) {
              ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;
              ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            }
            
          }
          else {
            ctx.fillStyle = "black";
            ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            ctx.fillStyle = "white";
            ctx.fillRect((this.canvas.width - 817 + 242*(i%5+1))/2, 331 + 106*j, 96, 80);
            ctx.fillStyle = "black";
            ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityText, (this.canvas.width - 805 + 242*(i%5+1))/2, 350 + 106*j, 80);
            // Mana
            if (itemList.items[this.state.player.items[i][2]].manaCost !== 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].manaCost, (this.canvas.width - 792 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaCostIcon, (this.canvas.width - 766 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Poison
            if (itemList.items[this.state.player.items[i][2]].dot > 0) {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].dot, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.poison1Icon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Attack
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "attack") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.attackIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 385 + 106*j, 15, 20);
            }
            // Mana Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "manaRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.manaRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            }
            // Health Regen
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "healthRegen") {
              ctx.fillText(itemList.items[this.state.player.items[i][2]].abilityEffect, (this.canvas.width - 712 + 242*(i%5+1))/2, 400 + 106*j, 80)
              ctx.drawImage(this.healthRegenIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 386 + 106*j, 15, 17);
            } 
            // Block Enemy
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "enemy") {
              ctx.drawImage(this.blockEnemyIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }
            // Block Self
            else if (itemList.items[this.state.player.items[i][2]].abilityType === "block" && itemList.items[this.state.player.items[i][2]].abilityEffect === "self") {
              ctx.drawImage(this.blockSelfIcon, (this.canvas.width - 686 + 242*(i%5+1))/2, 384 + 106*j, 15, 20);
            }

            if (this.state.player.activeItems.includes(this.state.player.items[i][2])) {
              ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;
              ctx.fillRect((this.canvas.width - 821 + 242*(i%5+1))/2, 329 + 106*j, 100, 84);
            }
          }
        }
      }
    }
    

  }

  battleUpdate = () => {
    // Do battle update

  }

  battleDraw = () => {
    // Do battle draw

  }
  
    
  update = (deltaTime) => {
    // Move player
    const { keys } = this.state;

    // Check if wait is over
    if (this.state.player.location.wait <= 0) {
      // Check key inputs
      if (keys.w) {
        this.checkDirection([0, -1]);
      } else if (keys.a) {
        this.checkDirection([-1, 0]);
      } else if (keys.s) {
        this.checkDirection([0, 1]);
      } else if (keys.d) {
        this.checkDirection([1, 0]);
      }
    }
    
    else {
      this.setState((prevState) => ({
        player: {
          ...prevState.player,
          location: {
            ...prevState.player.location,
            wait: this.state.player.location.wait - 7*this.state.player.stats.speed*deltaTime,
          }
        },
      }));
    }

    // Update actions
    if (this.state.player.burn && this.state.player.health > 0) {
      this.setState((prevState) => ({
        player: {
          ...prevState.player,
          health: this.state.player.health - 0.05
        },
      }));
    }
    if (this.state.player.heal && this.state.player.health < this.state.player.stats.maxHealth - 0.05) {
      this.setState((prevState) => ({
        player: {
          ...prevState.player,
          health: this.state.player.health + 0.05
        },
      }));
    }
        
    // Insert player
    const jsonMap = JSON.parse(localStorage.getItem('mapStorage')).maps[0].design;
    const playerLoc = this.state.player.location;

    var bottomArray = jsonMap.map(row => row.split(''));
    bottomArray[playerLoc.y][playerLoc.x] = "o";
    bottomArray = bottomArray.map(row => row.join(''));
    // Replace spaces
    bottomArray = bottomArray.map(row => row.replace(/ /g, '•'));

    var topArray = jsonMap.map(row => row.replace(/[^# ]/g, ' ')); // Remove characters other than '#' and ' ' and '-'
    

    // Update
    this.setState((prevState) => ({
      map: {
        ...prevState.map,
        bottom: bottomArray,
        top: topArray
      },
    }));

  };

  draw = () => {
    const ctx = this.canvas.getContext("2d");
  
    // Font setup
    const fontSize = 30;
    ctx.font = fontSize + "px robotoMono";
  
    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
    // Calculate center position of the canvas
    const canvasCenterX = this.canvas.width / 2;
    const canvasCenterY = this.canvas.height / 2;
  
    // Draw map
    const bottom = this.state.map.bottom;
    const top = this.state.map.top;
    const playerLoc = this.state.player.location;
  
    // Draw bottom layer
    for (var i = 0; i < bottom.length; i++) {
      for (var j = 0; j < bottom[i].length; j++) {
        const coords = [
          canvasCenterX - 1.2 * (playerLoc.x - j) * fontSize + 0.12 * playerLoc.wait * fontSize * playerLoc.direction.x,
          canvasCenterY + (0.65 + 3/20) * fontSize * (1.2 * i - (playerLoc.y + 4) / 2) + (0.65 + 3/20) * 0.043 * playerLoc.wait * fontSize * playerLoc.direction.y
        ];
  
        if (bottom[i][j] === 'o') {
          ctx.fillStyle = "white"; // White color for the player
        } 
        else if (bottom[i][j] === '-'){
          ctx.fillStyle = `rgba(255, 255, 255, 0)`; // Removes '-' placeholder
        }
        else if (bottom[i][j] === '~'){
          ctx.fillStyle = `rgba(255, 0, 0, 1)`; // Red color for lava
        }
        else if (bottom[i][j] === '='){
          ctx.fillStyle = `rgba(20, 110, 255, 1)`; // Blue color for healing water
        }
        else if (bottom[i][j] === '?'){
          ctx.fillStyle = `rgba(255, 230, 0, 1)`; // Yellow color for chest
        }
        else {
          ctx.fillStyle = `rgba(255, 255, 255, 0.25)`; // Grey for everything else :)
        }
  
        ctx.fillText(bottom[i][j], coords[0], coords[1]);
      }
    }
  
    // Draw top layers
    // eslint-disable-next-line
    for (var j = 4; j < 7; j++) {
      const newSize = fontSize + 1.2 * j - 3 * 1.2;
      ctx.font = newSize + "px robotoMono";
      // eslint-disable-next-line
      for (var i = 0; i < top.length; i++) {
        const coords = [
          canvasCenterX - 1.2 * playerLoc.x * newSize + 0.12 * playerLoc.wait * newSize * playerLoc.direction.x,
          canvasCenterY + (0.65 + j/20) * newSize * (1.2 * i - (playerLoc.y + 4) / 2) + (0.65 + j/20) * 0.043 * playerLoc.wait * newSize * playerLoc.direction.y
        ];
        ctx.fillStyle = `rgba(255, 255, 255, ${(j - 2) / 4})`;
        ctx.fillText(top[i].split("").join(String.fromCharCode(8202)), coords[0], coords[1]);
      }
    }

    // Draw vignette
    if (this.state.vignetteLoaded) {
      ctx.drawImage(this.vignette, 0, 0, this.canvas.width, this.canvas.height);
      if (this.state.player.burn) {
        ctx.drawImage(this.vignetteR, 0, 0, this.canvas.width, this.canvas.height);
      } else if (this.state.player.heal) {
        ctx.drawImage(this.vignetteB, 0, 0, this.canvas.width, this.canvas.height);
      }
    }
    else {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    

    // Draw HUD
    // Box
    ctx.fillStyle = "white";
    ctx.fillRect(10, 10, 270, this.state.player.stats.maxHealth*2.2 + 75);
    ctx.fillStyle = "black";
    ctx.fillRect(12, 12, 266, this.state.player.stats.maxHealth*2.2 + 71);

    // Avatar
    ctx.fillStyle = `rgb(
      ${(255/this.state.player.stats.maxHealth)*(this.state.player.stats.maxHealth-Math.abs(this.state.player.health))},
      ${(255/this.state.player.stats.maxHealth)*Math.abs(this.state.player.health)}, 
    0)`;
    ctx.font = "50px robotoMono";
    var avatar;
    if (this.state.player.health >  9) {
      avatar = Math.ceil(this.state.player.health);
    }
    else {
      avatar = "0" + Math.ceil(this.state.player.health);
    }
    ctx.fillText(avatar, 23, 70);

    // Data
    // Health bar color changing
    ctx.fillStyle = 'white';
    if (this.state.player.burn) {
      ctx.fillStyle = 'red';
    }
    if (this.state.player.heal) {
      ctx.fillStyle = `rgba(20, 110, 255, 1)`;
    }
    ctx.font = "25px robotoMono";

    // Health bar beyond first line
    // eslint-disable-next-line
    for (var j = 0; j < this.state.player.stats.maxHealth; j += 10) {
      var healthBar = "";
      if (j + 10 > this.state.player.stats.maxHealth) {
        // eslint-disable-next-line
        for (var i = j + 1; i <= this.state.player.stats.maxHealth; i++) {
          if (i <=  Math.ceil(this.state.player.health)) {
            healthBar = healthBar + "#";
          }
          else {
            healthBar = healthBar + "-";
          }
        }
      }
      else {
        // eslint-disable-next-line
        for (var i = j + 1; i <= j+10; i++) {
          if (i <=  Math.ceil(this.state.player.health)) {
            healthBar = healthBar + "#";
          }
          else {
            healthBar = healthBar + "-";
          }
        }
      }
      
      ctx.fillText(healthBar, 97, 75 + 2.5*j);
    }

    // Health text
    ctx.fillStyle = 'white';
    ctx.font = "20px robotoMono";
    ctx.fillText("Health:", 98, 45);

    // Stats box
    if (this.state.keys.tab) {
      // Box
      ctx.fillStyle = "white";
      ctx.fillRect((this.canvas.width - 380)/2, 200, 380, 300 + this.state.player.items.length*70);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width - 376)/2, 202, 376, 296 + this.state.player.items.length*70);

      
      ctx.fillStyle = "white";
      // Line seperator
      if (this.state.player.items.length > 0) {
        ctx.fillRect((this.canvas.width - 320)/2, 468, 320, 2);
      }
      // Stats
      ctx.font = "20px robotoMono";
      ctx.fillText("Stats:", (this.canvas.width - 20*3)/2, 240);
      ctx.fillText(`Max Health:  ${this.state.player.stats.maxHealth.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})}`, (this.canvas.width - 180)/2, 320);
      ctx.fillText(`Max Mana:    ${this.state.player.stats.maxMana.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})}`, (this.canvas.width - 180)/2, 360);
      ctx.fillText(`Damage:      ${this.state.player.stats.damage.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})}`, (this.canvas.width - 180)/2, 400);

      // Items
      // eslint-disable-next-line
      for (var i = 0; i < this.state.player.items.length; i++) {
        ctx.fillStyle = "white";
        ctx.fillText(this.state.player.items[i][0], (this.canvas.width - 12*this.state.player.items[i][0].length)/2, 510 + i*70);
        ctx.fillStyle = `rgba(20, 110, 255, 1)`;
        ctx.fillText(this.state.player.items[i][1], (this.canvas.width - 12*this.state.player.items[i][1].length)/2, 540 + i*70);
      }
    }

    // Chest popup
    if (this.state.chest.view !== "") {
      // Box
      ctx.fillStyle = "white";
      ctx.fillRect((this.canvas.width - 480)/2, 300, 480, 300);
      ctx.fillStyle = "black";
      ctx.fillRect((this.canvas.width - 476)/2, 302, 476, 296);

      // Text
      ctx.fillStyle = `rgba(255, 230, 0, 1)`;
      ctx.font = "20px robotoMono";
      ctx.fillText("You found a chest!", (this.canvas.width - 21*10)/2, 350);

      ctx.fillStyle = "white";
      const chestText = "Acquired \"" + this.state.chest.view + "\"";
      ctx.fillText(chestText, (this.canvas.width - 12*chestText.length)/2, 410);
      var perkText = this.state.chest.perk;
      ctx.fillText(perkText, (this.canvas.width - 12*perkText.length)/2, 450);
    
      const closeChest = "Press <space> to close"
      ctx.fillStyle = "grey";
      ctx.fillText(closeChest, (this.canvas.width - 12*closeChest.length)/2, 540);

      ctx.fillStyle = `rgba(20, 110, 255, 1)`;
      ctx.font = "35px robotoMono";
      const abilityText = "New ability unlocked!";
      ctx.fillText(abilityText, (this.canvas.width - 21*abilityText.length)/2, 170);

    }


    // Death
    if (this.state.player.health <= 0) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = "80px robotoMono";
      ctx.fillText("You died!", this.canvas.width/2 - 2*100, 300);

      ctx.font = "30px robotoMono";
      if (this.state.menu.quit) {
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 285)/2, 510, 290, 84);
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 281)/2, 512, 286, 80);
        ctx.fillStyle = "black";
        ctx.fillText("Quit", (this.canvas.width - 73)/2, 563);
      }
      else {
        ctx.fillStyle = "white";
        ctx.fillRect((this.canvas.width - 285)/2, 510, 290, 84);
        ctx.fillStyle = "black";
        ctx.fillRect((this.canvas.width - 281)/2, 512, 286, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Quit", (this.canvas.width - 73)/2, 563);
      }
    }
    

  };
    
  render() {

    return (
      <div>
        <canvas
          ref={(canvas) => (this.canvas = canvas)}
          width={1200}
          height={900}
          id='canvas'
        />
      </div>
    );
  }
}

export default Game;