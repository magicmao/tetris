import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

var gameConfig = { width: 16, height: 20, totalBlocks: (16 * 20), waitMilliSeconds: 1000, currentScore: 0 };
var gameBlocks = Array(gameConfig.totalBlocks).fill(0).map(x => ({ value: null, color: 0, type: 0 }));
var gameGlobal = {
    currentBlock: null,
    currentBlocks: null,
    gamePanel: React.createRef(),
    gameControl: React.createRef(),
    timer: React.createRef(),
    setGamePanelState: function (props) {
        this.currentBlock = props;
        if (!this.gamePanel.current) return;
        this.gamePanel.current.forceUpdate();
    },
    updateWaitMilliSeconds: function (waitMilliSeconds) { this.timer.current.updateWaitMilliSeconds(waitMilliSeconds); },
    timerDown: function () { this.gameControl.current.handleCommand('timer↓') },
    pauseTimer: function () { this.timer.current.cancelTimer(); },
    resumeTimer: function () { this.timer.current.startTimer(); },
    newBlock: function () {
        let newBlock = {
            x: gameConfig.width / 2,
            y: 0,
            block: new Block({ type: this.random(0, 6), rotation: this.random(0, 3), color: this.random(1, 6) })
        };
        this.setGamePanelState(newBlock);
        return newBlock;
    },
    random(start, end) {
        return Math.floor(start + Math.random() * (end - start + 1));
    },
    removeFullRows() {
        this.timer.current.cancelTimer();
        let lines = [];
        for (var y = 0; y < gameConfig.height; y++) {
            let index = y * gameConfig.width;
            let x = 0;
            for (; x < gameConfig.width; x++) {
                if (gameGlobal.currentBlocks[index++].value == null) break;
            }
            if (x == gameConfig.width) lines.push(y);
        }
        if (lines.length > 0) {
            gameConfig.currentScore += ROWS_SCORES[lines.length];
            this.flashRows({ counter: 10, data: lines });
        } else {
            this.newBlock();
            this.timer.current.startTimer();
        }
    },
    flashRows(props) {
        if (props.counter-- > 0) {
            let color = (props.counter % 2) ? 7 : 6;
            for (var i = 0; i < 10; i++) {
                props.data.forEach((y) => {
                    let index = y * gameConfig.width;
                    for (var x = 0; x < gameConfig.width; x++) {
                        gameGlobal.currentBlocks[index].color = color;
                        gameGlobal.currentBlocks[index++].value = "X";
                    }
                });
                gameGlobal.setGamePanelState({ x: 0, y: 0, block: null });
            }
            setTimeout(gameGlobal.flashRows, 50, { counter: props.counter, data: props.data });
        } else {
            let delta = 0;
            let lines = props.data;
            for (var i = lines.length - 1; i >= 0; i--) {
                let y = lines[i] + delta++;
                for (; y > 0; y--) {
                    let indexFrom = (y - 1) * gameConfig.width;
                    let indexTo = y * gameConfig.width;
                    for (var x = 0; x < gameConfig.width; x++) {
                        gameGlobal.currentBlocks[indexTo++] = clone(gameGlobal.currentBlocks[indexFrom++]);
                    }
                    gameGlobal.currentBlocks[0] = { value: null, color: 0, type: 0 };
                }
            }
            gameGlobal.newBlock();
            gameGlobal.timer.current.startTimer();
        }
    }
};
const TOTAL_COLORS = ["",
    " color-gray",
    " color-green",
    " color-cyan",
    " color-red",
    " color-magenta",
    " color-yellow",
    " color-white",
];
const TOTAL_BLOCKS = [
    [[[1, 0], [1, 1], [1, 2], [1, 3]], [[0, 1], [1, 1], [2, 1], [3, 1]], [[1, 0], [1, 1], [1, 2], [1, 3]], [[0, 1], [1, 1], [2, 1], [3, 1]]],
    [[[1, 1], [1, 2], [2, 1], [2, 2]], [[1, 1], [1, 2], [2, 1], [2, 2]], [[1, 1], [1, 2], [2, 1], [2, 2]], [[1, 1], [1, 2], [2, 1], [2, 2]]],
    [[[1, 0], [1, 1], [1, 2], [2, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]]],
    [[[1, 0], [1, 1], [2, 1], [2, 2]], [[1, 1], [2, 1], [0, 2], [1, 2]], [[1, 0], [1, 1], [2, 1], [2, 2]], [[1, 1], [2, 1], [0, 2], [1, 2]]],
    [[[2, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [1, 2], [2, 2]], [[2, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [1, 2], [2, 2]]],
    [[[1, 0], [2, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [0, 2], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]]],
    [[[0, 0], [1, 0], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[2, 0], [0, 1], [1, 1], [2, 1]]]
];
const ROWS_SCORES = [0, 100, 300, 600, 1000];

function clone(item) {
    if (!item) { return item; } // null, undefined values check

    var types = [Number, String, Boolean],
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function (type) {
        if (item instanceof type) {
            result = type(item);
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call(item) === "[object Array]") {
            result = [];
            item.forEach(function (child, index, array) {
                result[index] = clone(child);
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                result = item.cloneNode(true);
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else if (item instanceof Block) {
                    result = new Block(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = clone(item[i]);
                    }
                }
            } else {
                // depending what you would like here,
                // just keep the reference, or create new object
                if (false && item.constructor) {
                    // would not advice to do that, reason? Read below
                    result = new item.constructor();
                } else {
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }

    return result;
}

class Block {
    constructor(props) {
        if (props instanceof Block)
            this.block = { ...props.block };
        else
            this.block = { ...props };
    }
    getInstance() {
        return [TOTAL_BLOCKS[this.block.type][this.block.rotation], this.block.color];
    }
    rotate() {
        this.block.rotation = ++this.block.rotation % 4;
        return this.getInstance();
    }
}

const ControlSquare = (props) => {
    let classNames = "control-square" + ((props.value) ? "" : " empty");
    return (
        <button className={classNames} onClick={props.onClick}>
            {props.value}
        </button>
    );
}

const GameSquare = (props) => {
    let v = props.value;
    let classNames = "game-square" + ((v.value != null) ? ((v.color) ? TOTAL_COLORS[v.color] : "") : " empty");
    return (
        <button className={classNames}>
            {v.value}
        </button>
    );
}

const GameContent = (props) => {
    let blocks = clone(gameGlobal.currentBlocks);
    if (gameGlobal.currentBlock.block) {
        let [currentBlock, color] = gameGlobal.currentBlock.block.getInstance();
        for (var i = 0; i < 4; i++) {
            let index = (gameGlobal.currentBlock.y + currentBlock[i][1]) * gameConfig.width + gameGlobal.currentBlock.x + currentBlock[i][0];
            blocks[index].color = color;
            blocks[index].value = "●";
        }
    }
    blocks = blocks.map((currentValue, index, arr) => {
        return (
            <GameSquare
                key={index}
                value={currentValue}
            />
        )
    });

    let lines = new Array(gameConfig.totalBlocks / gameConfig.width + 1).fill(null);
    for (let i = 0; i < lines.length; i++) {
        let index = i * gameConfig.width;
        lines[i] = (
            <div key={i} className="board-row">
                {blocks.slice(index, index + gameConfig.width)}
            </div>
        )
    }

    return (
        <div>
            {lines}
        </div>
    );
}

const GameInfo = () => <div>Total Score: {gameConfig.currentScore}</div>;

class GameControl extends React.Component {
    constructor(props) {
        super(props);
        this.controlSquareTexts = [null, '↑', null, '←', '↓', '→'];
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.isButton = false;
    }
    renderControlSquare(i) {
        return (
            <ControlSquare
                value={this.controlSquareTexts[i]}
                onClick={() => this.handleClick(this.controlSquareTexts[i])}
            />
        );
    }
    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderControlSquare(0)}
                    {this.renderControlSquare(1)}
                    {this.renderControlSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderControlSquare(3)}
                    {this.renderControlSquare(4)}
                    {this.renderControlSquare(5)}
                </div>
            </div>
        );
    }
    handleClick(command) {
        if (!command) {
            this.isButton = false;
        } else {
            this.isButton = true;
            this.handleCommand(command);
        }
    }
    isValid(gameStatus) {
        let blocks = clone(gameGlobal.currentBlocks);
        if (gameStatus.block) {
            let [currentBlock, color] = gameStatus.block.getInstance();
            for (var i = 0; i < 4; i++) {
                let x = gameStatus.x + currentBlock[i][0];
                let y = gameStatus.y + currentBlock[i][1];
                if (x < 0) return null;
                if (y < 0) return null;
                if (x >= gameConfig.width) return null;
                if (y >= gameConfig.height) return null;
                let index = y * gameConfig.width + x;
                if (blocks[index].value != null)
                    return null;
                blocks[index].color = color;
                blocks[index].value = "●";
            }
        }
        return blocks;
    }
    handleCommand(commandText) {
        let gameStatus = clone(gameGlobal.currentBlock);
        let needNewBlock = false;
        switch (commandText) {
            case 27:    // Escape
                this.isButton = false;
                console.log('You just pressed Escape!');
                gameGlobal.pauseTimer();
                break;
            case 37:    // <
                if (this.isButton) return;
            case '←':
                console.log('left');
                gameStatus.x--;
                break;
            case 38:    // ^
                if (this.isButton) return;
            case '↑':
                console.log('up');
                gameStatus.block.rotate();
                break;
            case 39:    // >
                if (this.isButton) return;
            case '→':
                console.log('right');
                gameStatus.x++;
                break;
            case 40:    // v
                if (this.isButton) return;
            case '↓':
                console.log('down');
                gameStatus.y++;
                break;
            case 'timer↓':
                console.log('timer down');
                gameStatus.y++;
                needNewBlock = !this.isValid(gameStatus);
                if (needNewBlock) gameStatus.y--;
                break;
            case 32:    // space
                if (this.isButton) return;
                console.log('space');
                let y = gameStatus.y;
                do {
                    y = gameStatus.y++;
                } while (this.isValid(gameStatus));
                gameStatus.y = y;
                needNewBlock = true;
                break;
            default:
                return;
        }

        let newBlocks = this.isValid(gameStatus);
        if (newBlocks)
            gameGlobal.setGamePanelState(gameStatus);
        if (needNewBlock) {
            gameGlobal.currentBlocks = clone(newBlocks);
            gameGlobal.removeFullRows();
        }
    }
    handleKeyPress(e) {
        this.handleCommand(e.keyCode);
    }
    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPress);
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

class Timer extends React.Component {
    constructor(props) {
        super(props);
        this.interval = null;
    }

    tick() {
        gameGlobal.timerDown();
    }

    componentDidMount() {
        this.startTimer();
    }

    componentWillUnmount() {
        this.cancelTimer();
    }

    updateWaitMilliSeconds(waitMilliSeconds) {
        gameConfig.waitMilliSeconds = waitMilliSeconds;
        this.cancelTimer();
        this.startTimer();
    }
    cancelTimer() {
        clearInterval(this.interval);
        this.interval = null;
    }
    startTimer() {
        if (!this.interval)
            this.interval = setInterval(() => this.tick(), gameConfig.waitMilliSeconds);
    }
    render() {
        return (
            <></>
        );
    }
}

class GamePanel extends React.Component {
    constructor(props) {
        super(props);
        gameGlobal.currentBlock = gameGlobal.newBlock();
        gameGlobal.currentBlocks = clone(gameBlocks);
    }

    render() {
        return (
            <>
                <table cellSpacing="0" ><tbody>
                    <tr><td rowSpan="2" className="game-content"><GameContent /></td><td className="game-info"><GameInfo /></td></tr>
                    <tr><td className="game-control">
                        <GameControl ref={gameGlobal.gameControl} />
                        <Timer ref={gameGlobal.timer} /></td>
                    </tr></tbody></table>
                <div>
                    <p>You clicked {gameGlobal.currentBlock.waitMilliSeconds} times</p>
                    <button onClick={() => gameGlobal.resumeTimer()}>
                        Click me
        </button>
                </div>
            </>
        );
    }
}

// ========================================

ReactDOM.render(
    <GamePanel ref={gameGlobal.gamePanel} />,
    document.getElementById('root')
);
