import React, { Component } from 'react';
// import DoubleClick from './DoubleClick.js';
import './style.css';
import _ from 'lodash'
import flag from './flag.svg';

class App extends Component {

  constructor(props) {
    super(props);
    this.boardX = Array.from(Array(20).keys());
    this.boardY = Array.from(Array(40).keys());
    this.mineCount = 50;
    this.surrounding = [
      {x: -1, y: -1},
      {x: 0, y: -1},
      {x: 1, y: -1},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1},
      {x: -1, y: 1},
      {x: -1, y: 0}
    ];
    this.state = {
      failed: false
    };
  }

  componentWillMount() {
    this.setState({
      board: this.addCounts(this.addMines(this.createBoard()))
    });
  }

  componentDidMount() {
    window.oncontextmenu = function (e) {
      e.preventDefault();
    };
  }

  addCounts(board) {
    var tmpX,tmpY,count;
    _.each(board, (value, key) => {
      count = 0;
      if (!value.mine) {
        this.searchSurrounding(lookup => {
          tmpX = value.x + lookup.x;
          tmpY = value.y + lookup.y;
          if (this.onBoard(tmpX, tmpY) && this.isMine(tmpX, tmpY, board)) {
            count++;
          }
        });
      }
      if (count > 0) {
        board[key] = {...value, ...{number: count}};
      }
    });
    return board;
  }

  addMines(board) {
    var mines = {}, x, y;
    while (_.values(mines).length < this.mineCount) {
      x = _.random(0, this.boardX.length-1);
      y = _.random(0, this.boardY.length-1);
      mines[this.xyKey(x,y)] = 1;
      board[this.xyKey(x,y)] = {...board[this.xyKey(x,y)], ...{mine: true}};
    }
    return board;
  }

  createBoard() {
    var board = {};
    _.each(this.boardX, x => {
      _.each(this.boardY, y => {
        board[this.xyKey(x,y)] = {x, y, mine: false, number: false, expanded: false, flagged: false}
      })
    })
    return board;
  }

  isMine(x, y, board = this.state.board) {
    return board[this.xyKey(x,y)].mine === true;
  }

  isNumber(x, y, board = this.state.board) {
    return board[this.xyKey(x,y)].number !== false;
  }

  isZero(x, y) {
    return !this.isNumber(x, y) && !this.isMine(x, y)
  }

  isExpanded(x, y, board = this.state.board) {
    return board[this.xyKey(x,y)].expanded === true;
  }

  isFlagged(x, y, board = this.state.board) {
    return board[this.xyKey(x,y)].flagged === true;
  }

  xyKey(x, y) {
    return `${x},${y}`;
  }

  // getWidth() {
  //   return Math.max(
  //     document.body.scrollWidth,
  //     document.documentElement.scrollWidth,
  //     document.body.offsetWidth,
  //     document.documentElement.offsetWidth,
  //     document.documentElement.clientWidth
  //   );
  // }

  // getHeight() {
  //   return Math.max(
  //     document.body.scrollHeight,
  //     document.documentElement.scrollHeight,
  //     document.body.offsetHeight,
  //     document.documentElement.offsetHeight,
  //     document.documentElement.clientHeight
  //   );
  // }

  clicked(x,y) {
    this.tmpBoard = this.state.board;
    if (this.isExpanded(x, y) && this.isNumber(x, y)) {
      this.expandSurroundingIfFulfilled(x, y);
    } else if (this.isExpanded(x, y) && this.isZero(x,y)) {
      this.expandZeros(x,y);
    } else {
      this.dropFlag(x,y);
    }
    this.setState({board: this.tmpBoard});
    console.log(`Clicked x:${x}, y:${y}`);
  }

  rightClicked(x,y) {
    this.tmpBoard = this.state.board;

    if (this.isZero(x,y)) {
      this.expandZeros(x,y);
    }
    this.expandSpot(x,y);
    this.setState({board: this.tmpBoard});
    console.log(`Right clicked x:${x}, y:${y}`);
  }

  dropFlag(x,y) {
    this.editSpot(x,y,{flagged: !this.isFlagged(x,y)});
  }

  editSpot(x,y,object) {
    this.tmpBoard = {...this.tmpBoard, ...{[this.xyKey(x,y)]: {...this.tmpBoard[this.xyKey(x,y)], ...object}}};
  }

  expandSpot(x,y) {
    if (this.isMine(x,y)) {
      this.setState({failed: true});
    } else {
      this.editSpot(x,y,{expanded: true});
    }
  }

  expandZeros(x,y) {
    var tmpX, tmpY;
    this.searchSurrounding(lookup => {
      tmpX = x + lookup.x;
      tmpY = y + lookup.y;
      if (this.onBoard(tmpX, tmpY) && !this.isExpanded(tmpX,tmpY,this.tmpBoard)) {
        this.expandSpot(tmpX, tmpY);
        if (this.isZero(tmpX,tmpY)) {
          this.expandZeros(tmpX, tmpY);
        }
      }
    });
  }

  expandSurroundingIfFulfilled(x,y) {
    var count = 0, tmpX, tmpY;
    const number = this.tmpBoard[this.xyKey(x,y)].number;
    this.searchSurrounding(lookup => {
      tmpX = x + lookup.x;
      tmpY = y + lookup.y;
      if (this.onBoard(tmpX, tmpY) && this.isFlagged(tmpX,tmpY,this.tmpBoard)) {
        count++;
      }
    });
    if (number == count) {
      this.searchSurrounding(lookup => {
        tmpX = x + lookup.x;
        tmpY = y + lookup.y;
        if (this.onBoard(tmpX, tmpY) && !this.isFlagged(tmpX,tmpY,this.tmpBoard)) {
          this.expandSpot(tmpX, tmpY);
          if (this.isZero(tmpX, tmpY)) {
            this.expandZeros(tmpX,tmpY);
          }
        }
      });
    }
  }

  onBoard(x,y) {
    return this.boardX[x] !== undefined && this.boardY[y] !== undefined;
  }

  searchSurrounding(block) {
    _.each(this.surrounding, block);
  }

  displaySpot(x, y) {
    const spot = this.state.board[this.xyKey(x,y)];
    if (spot.flagged) {
      return <img src={flag} className="w-6" alt="flag" />;
    } else if (spot.expanded) {
      if (spot.number) {
        return spot.number;
      } else if (spot.mine) {
        return 'Mine';
      }
    }
  }

  spotColor(x,y) {
    if (this.isFlagged(x,y)) {
      return 'bg-red-lighter';
    } else if (this.isExpanded(x,y)) {
      return 'bg-grey-lighter';
    } else {
      return 'bg-blue-lighter';
    }
  }

  draw() {
    return _.map(this.boardX, x => {
      return (
        <div key={x} className="flex">
          {_.map(this.boardY, y => {
            return (
              <div
                key={this.xyKey(x,y)}
                className={`w-10 h-10 mr-px mb-px flex justify-center items-center select-none cursor-pointer ${this.spotColor(x,y)}`}
                data-number={this.isNumber(x,y) && this.state.board[this.xyKey(x,y)].number}
                onClick={this.clicked.bind(this, x, y)}
                onContextMenu={this.rightClicked.bind(this, x, y)}
              >
                {this.displaySpot(x,y)}
              </div>
            );
          })}
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        {this.state.failed && 'You failed!'}
        <div className="flex justify-center items-center h-screen bg-blue-lighter">
          <div className="inline-flex flex-wrap flex-col bg-blue-light border border-blue-light font-black text-xl" style={{borderBottom: 0, borderRight: 0}}>
            {this.draw()}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
