//canavs setup

const displayCanvas = document.getElementById("canvas");
const displayCtx = displayCanvas.getContext("2d", { willReadFrequently: true });

const container = displayCanvas.parentElement;
displayCanvas.width = container.clientWidth;
displayCanvas.height = container.clientHeight;



// resizing
window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    

    const temp = document.createElement("canvas");
    temp.width = displayCanvas.width;
    temp.height = displayCanvas.height;
    const tempCtx = temp.getContext("2d");
    tempCtx.drawImage(displayCanvas, 0, 0);
    

    displayCanvas.width = newWidth;
    displayCanvas.height = newHeight;
    
 
    displayCtx.lineWidth = 10;
    displayCtx.strokeStyle = "black";
    displayCtx.lineCap = "round";
 
    displayCtx.drawImage(temp, 0, 0, newWidth, newHeight);
  
    redrawFrame();
});

//drawing settings
displayCtx.lineWidth = 10;
displayCtx.strokeStyle = "black";
displayCtx.lineCap = "round";

//drawing buttons -- FIX DRAW AND ERASE
const drawBtn = document.getElementById("draw"); 
drawBtn.addEventListener("click", () => {

});
const eraserBtn = document.getElementById("erase");
eraserBtn.addEventListener("click", () => {

});
const clearBtn = document.getElementById("clear");
clearBtn.addEventListener("click", () => {
    const clearStroke = {
        type: "clear"
    };

    frameStrokes[currentFrame].push(clearStroke);
    frameUndoneStrokes[currentFrame] = [];

    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    saveCurrentFrame();
});

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

function redrawFrame() {
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    for (let item of getCurrentStrokes()) {
        if (item.type === "clear") {
            displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            continue;
        }

        displayCtx.strokeStyle = item.color;
        displayCtx.lineWidth = item.lineWidth;
        displayCtx.stroke(item.path);
    }

    if (usingOnion) {
        onionSkin();
    }
}


function saveCurrentFrame(){

    frames[currentFrame].ctx.clearRect(0, 0, frames[currentFrame].newFrame.width, frames[currentFrame].newFrame.height);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = displayCanvas.width;
    tempCanvas.height = displayCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.lineWidth = displayCtx.lineWidth;
    tempCtx.strokeStyle = displayCtx.strokeStyle;
    tempCtx.lineCap = displayCtx.lineCap;
    
    for (let item of getCurrentStrokes()) {
        if(item.type === "clear"){
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            continue;
        }
        else{
            tempCtx.strokeStyle = item.color;
            tempCtx.lineWidth = item.lineWidth;
            tempCtx.stroke(item.path);
        }
    }
    
    frames[currentFrame].ctx.drawImage(tempCanvas, 0, 0);
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
        frameStrokes[currentFrame].push({
            path: currentPath,
            color: currentColor,
            lineWidth: displayCtx.lineWidth
        });
        frameUndoneStrokes[currentFrame] = [];
        console.log(svg);
    }
    drawing = false;
});

displayCanvas.addEventListener("mouseleave", (e) => {
    if(drawing && currentPath) {
        frameStrokes[currentFrame].push({
            path: currentPath,
            color: currentColor,
            lineWidth: displayCtx.lineWidth
        });
        frameUndoneStrokes[currentFrame] = [];
        console.log(svg);
    }
    drawing = false;
});

//SVG tracing function
let svg = "";
function trackSvgPath(key, x, y){
    svg += `${key}${x} ${y} `;
}

//SVG download button
const downloadBtn = document.getElementById("download");
downloadBtn.addEventListener("click", async () => {
    let svgTag = ' width="400px" height="400px" xmlns="http://www.w3.org/2000/svg"';
    let finalSvg = `<svg ${svgTag}> <path d="${svg}" stroke-width="10" stroke="black" stroke-linecap="round" fill="none"/></svg>`; // CHANGE ATTRIBUTES TO USER PREFERENCES
    const blob = new Blob([finalSvg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = 'text.svg';
    a.click();
    URL.revokeObjectURL(a.href);

    const ctx = displayCanvas.getContext('2d');
    const svgData = displayCanvas.toDataURL();
    const v = await window.Canvg.fromString(ctx, svgData);
    await v.render();
    const svgString = v.svg();
    console.log(svgString);
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
    if(usingOnion && currentFrame > 0){
        onionSkin();
    }
}

//animation functionality
const playBtn = document.getElementById("play");
const stopBtn = document.getElementById("stop");
const fpsInput = document.getElementById("fpsInput");
const loopBtn = document.getElementById("loop");



let playing = false;
let fps = 12;
let frameInterval = 1000 / fps;
let playBack = 0;
let animationId = null;
let lastTime = 0;

fpsInput.addEventListener("input", () => { /////disable fps when animation is playing
    fps = parseInt(fpsInput.value);
    frameInterval = 1000 / fps;
    console.log("FPS:", fps);
});

function runAnimation(timestamp){
    if(!playing){
        return;
    }
    if(timestamp - lastTime > frameInterval){
        lastTime = timestamp;
    
        const frame = frames[playBack];
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.drawImage(frame.newFrame, 0, 0);
        
        updateCurrFrameDisplay(playBack + 1);
        playBack = (playBack + 1) % totalFrames;
    }
    requestAnimationFrame(runAnimation);
}

playBtn.addEventListener("click", () => {
    if(!playing){
        saveCurrentFrame();
        playing = true;
        lastTime = 0;
        playBack = 0;
        animationId = requestAnimationFrame(runAnimation);
    }
});

stopBtn.addEventListener("click", () => {
    stop();

});
function stop(){
    playing = false;
    cancelAnimationFrame(animationId);
    displayFrame(currentFrame);
    updateCurrFrameDisplay(shownFrameNum);

}

///delete frame
const deleteBtn = document.getElementById("deleteFrame");
deleteBtn.addEventListener("click", () => {
    deleteFrame(currentFrame);
});
function deleteFrame(i){
    console.log("Current frame index:", currentFrame, "Total frames:", frames.length);

    if(frames.length == 1){
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        frameStrokes.splice(i, 1);
        frameUndoneStrokes.splice(i, 1);
        frameStrokes[0] = [];
        frameUndoneStrokes[0] = [];
        saveCurrentFrame();
        return;
    }
    
    frames.splice(i, 1);
    frameStrokes.splice(i, 1);
    frameUndoneStrokes.splice(i, 1);
    totalFrames = frames.length;
    
    if(currentFrame >= frames.length){
        currentFrame = frames.length - 1;
    }

    updateShownFrameNum();
    updateCurrFrameDisplay(shownFrameNum);
    displayFrame(currentFrame);
    console.log("frame deleted");
    console.log("Current frame index:", currentFrame, "Total frames:", frames.length);

}

//Onion skinning
const onionBtn = document.getElementById("onion");

let onionCanvas = document.createElement("canvas");
let onionCtx = onionCanvas.getContext("2d");
let usingOnion = false;
onionBtn.addEventListener("click", () => {
    usingOnion = !usingOnion;
    if(usingOnion){
        onionSkin();
    }
    else {
        redrawFrame(); 
    }
});

function onionSkin(){
    if(currentFrame == 0){
        return;
    }
    
    for (let item of getCurrentStrokes()) {
        if(item.type === "clear"){
            displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            continue;
        }
        else{
            displayCtx.stroke(item);
        }
    }

    if (currentFrame > 0) {
        displayCtx.save();
        displayCtx.globalAlpha = 0.3;
        displayCtx.drawImage(frames[currentFrame - 1].newFrame, 0, 0);
        displayCtx.restore();
    }
}

const canvasContainer = document.getElementById("canvasContainer");
const editor = document.getElementById("editor");
const swapBtn = document.getElementById("swap");

swapBtn.addEventListener("click", () => {
    if (displayCanvas.style.display !== 'none') {
        displayCanvas.style.display = 'none';
        editor.style.display = 'block';
        if(playing){
            stop();
        }
    } else {
        displayCanvas.style.display= 'block';
        editor.style.display = 'none';
    }
});

//changing color


let currentColor = "black";


document.addEventListener("DOMContentLoaded", () => {
 
    Coloris({
      el: '#colorInput', // attach to input element
      theme: 'polaroid',
      format: 'rgb',
      onChange: (color, inputEl) => {
        setDrawingColor(color);
      }
    });
});


function setDrawingColor(color) {
    displayCtx.strokeStyle = color;


    if (frames[currentFrame]) {
        frames[currentFrame].ctx.strokeStyle = color;
    }

    currentColor = color;
}

const colorPickerBtn = document.getElementById("colorPicker");
let isPickingColor = false;

colorPickerBtn.addEventListener("click", () => {
  isPickingColor = true;
  displayCanvas.style.cursor = "crosshair"; 
  console.log("Color picker activated — click on the canvas to select a color.");
});

displayCanvas.addEventListener("click", (e) => {
  if (!isPickingColor) return;

  const rect = displayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const pixel = displayCtx.getImageData(x, y, 1, 1).data;
  const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

  console.log("Picked color:", color);
  setDrawingColor(color);

 
  isPickingColor = false;
  displayCanvas.style.cursor = "default";
});
