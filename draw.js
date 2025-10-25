//canavs setup
const displayCanvas = document.getElementById("canvas");
const displayCtx = displayCanvas.getContext("2d");

//drawing settings
displayCtx.lineWidth = 10;
displayCtx.strokeStyle = "black";
displayCtx.lineCap = "round";


//UNDO AND REDO
let frameStrokes = [[]];
let frameUndoneStrokes = [[]];
let currentPath;

function getCurrentStrokes() {
    return frameStrokes[currentFrame];
}

function getCurrentUndoneStrokes() {
    return frameUndoneStrokes[currentFrame];
}

const undoBtn = document.getElementById("undo");
undoBtn.addEventListener("click", () => {
    if(getCurrentStrokes().length === 0){
        if(currentFrame > 0){
            saveCurrentFrame();
            currentFrame -= 1;
            updateShownFrameNum();
            updateCurrFrameDisplay(shownFrameNum);
            displayFrame(currentFrame);
        }
        return;
    }
    const undone = frameStrokes[currentFrame].pop();
    frameUndoneStrokes[currentFrame].push(undone);
    redrawFrame();
    saveCurrentFrame();
});

const redoBtn = document.getElementById("redo");
redoBtn.addEventListener("click", () => {
    if(getCurrentUndoneStrokes().length === 0){
        if(currentFrame < totalFrames - 1){
            saveCurrentFrame();
            currentFrame += 1;
            updateShownFrameNum();
            updateCurrFrameDisplay(shownFrameNum);
            displayFrame(currentFrame);
        }
        return;
    }
    const redone = frameUndoneStrokes[currentFrame].pop();
    frameStrokes[currentFrame].push(redone);
    redrawFrame();
    saveCurrentFrame();
});

function redrawFrame(){
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    for (let path of getCurrentStrokes()) {
        displayCtx.stroke(path);
    }
}

function saveCurrentFrame(){
    frames[currentFrame].ctx.clearRect(0, 0, frames[currentFrame].newFrame.width, frames[currentFrame].newFrame.height);
    frames[currentFrame].ctx.drawImage(displayCanvas, 0, 0);
}


////drawing functions -- CHANGE FOR TOUCH AND STYLUS SUPPORT
let drawing = false;
displayCanvas.addEventListener("mousedown", (e) => {
    drawing = true;
    let x = e.offsetX;
    let y = e.offsetY;

    currentPath = new Path2D();

    currentPath.moveTo(x, y);
    trackSvgPath("M", x, y);
});

displayCanvas.addEventListener("mousemove", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;

    if(drawing){
        
        currentPath.lineTo(x, y);
        displayCtx.stroke(currentPath);
        trackSvgPath("L", x, y);
    }
});

displayCanvas.addEventListener("mouseup", (e) => {
    if(drawing && currentPath) {
        frameStrokes[currentFrame].push(currentPath);
        frameUndoneStrokes[currentFrame] = [];
    }
    drawing = false;
});

displayCanvas.addEventListener("mouseleave", (e) => {
    if(drawing && currentPath) {
        frameStrokes[currentFrame].push(currentPath);
        frameUndoneStrokes[currentFrame] = [];
    }
    drawing = false;
});

//SVG tracing function
let svg = "";
function trackSvgPath(key, x, y){
    svg += `${key}${x} ${y} `;
    console.log(svg);
}

//SVG download button
const downloadBtn = document.getElementById("download");
downloadBtn.addEventListener("click", () => {
    let svgTag = ' width="400px" height="400px" xmlns="http://www.w3.org/2000/svg"';
    let finalSvg = `<svg ${svgTag}> <path d="${svg}" stroke-width="10" stroke="black" stroke-linecap="round" fill="none"/></svg>`; // CHANGE ATTRIBUTES TO USER PREFERENCES
    const blob = new Blob([finalSvg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = 'text.svg';
    a.click();
    URL.revokeObjectURL(a.href);
});

//frames
let frames = [];
function addFrame(frame){
    frames.push(frame);
    totalFrames = frames.length;
}

function createFrame(){
    const newFrame = document.createElement("canvas");
    newFrame.height = displayCanvas.clientHeight;
    newFrame.width = displayCanvas.clientWidth;
    const ctx = newFrame.getContext("2d");

    return {newFrame, ctx};
}



const currFrameDisplay = document.getElementById("frameNum");
let currentFrame = 0;
let totalFrames = frames.length;
let shownFrameNum = 0;

function updateShownFrameNum(){
    shownFrameNum = currentFrame + 1;
}

function updateCurrFrameDisplay(num){
    currFrameDisplay.innerHTML = num;
}
updateShownFrameNum();
updateCurrFrameDisplay(shownFrameNum);

let firstFrame = createFrame();
addFrame(firstFrame);

updateCurrFrameDisplay(shownFrameNum);


const nextBtn = document.getElementById("nextFrame");
nextBtn.addEventListener("click", () => {
    saveCurrentFrame();
    if(currentFrame + 1 >= totalFrames){
        let nextFrame = createFrame();
        addFrame(nextFrame);
        frameStrokes.push([]);
        frameUndoneStrokes.push([]);
        currentFrame += 1;
        updateShownFrameNum();
        updateCurrFrameDisplay(shownFrameNum);
        displayFrame(currentFrame);
    }
    else{
        currentFrame += 1;
        updateShownFrameNum();
        updateCurrFrameDisplay(shownFrameNum);
        displayFrame(currentFrame);
    }
});

const prevBtn = document.getElementById("prevFrame");
prevBtn.addEventListener("click", () => {
    saveCurrentFrame();
    if(currentFrame > 0){
        currentFrame -= 1;
        updateShownFrameNum();
        updateCurrFrameDisplay(shownFrameNum);
        displayFrame(currentFrame);
    }
    else{
        return;
    }
});

function displayFrame(index){
    const frame = frames[index];
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayCtx.drawImage(frame.newFrame, 0, 0);
}

//animation functionality
const playBtn = document.getElementById("play");
const stopBtn = document.getElementById("stop");

let playing = false;
let fps = 2;
let frameInterval = 1000 / fps;
let playBack = 0;
let animationId = null;

function runAnimation(timestamp){
    if(!playing){
        return;
    }
    if(timestamp - lastTime > frameInterval){
        lastTime = timestamp;
        displayFrame(playBack);
        updateCurrFrameDisplay(playBack + 1);
        playBack = (playBack + 1) % totalFrames;
    }
    requestAnimationFrame(runAnimation);
}

playBtn.addEventListener("click", () => {
    if(!playing){
        frames[currentFrame].ctx.drawImage(displayCanvas, 0, 0);
        playing = true;
        lastTime = 0;
        animationId = requestAnimationFrame(runAnimation);
    }
});

stopBtn.addEventListener("click", () => {
    playing = false;
    cancelAnimationFrame(animationId);
    displayFrame(currentFrame);
    updateCurrFrameDisplay(shownFrameNum);
});

