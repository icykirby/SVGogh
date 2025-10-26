//canavs setup

const displayCanvas = document.getElementById("canvas");
const displayCtx = displayCanvas.getContext("2d", { willReadFrequently: true });

const container = displayCanvas.parentElement;
displayCanvas.width = container.clientWidth;
displayCanvas.height = container.clientHeight;

const brushSizeInput = document.getElementById("brushSizeInput");
let brushSize = 5;
brushSizeInput.addEventListener("input", () => {
    brushSize = parseInt(brushSizeInput.value);
    console.log("brush size", brushSize);
});

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


    displayCtx.lineWidth = brushSize;
    displayCtx.strokeStyle = "black";
    displayCtx.lineCap = "round";

    displayCtx.drawImage(temp, 0, 0, newWidth, newHeight);

    redrawFrame();
});

//drawing settings
displayCtx.lineWidth = brushSize;
displayCtx.strokeStyle = "black";
displayCtx.lineCap = "round";

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
    if (getCurrentStrokes().length === 0) {
        if (currentFrame > 0) {
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
    if (getCurrentUndoneStrokes().length === 0) {
        if (currentFrame < totalFrames - 1) {
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

function displayFrame(index) {

    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    const frame = frames[index];
    displayCtx.drawImage(frame.newFrame, 0, 0);

    if (usingOnion && currentFrame > 0) {
        onionSkin();
    }
}

function saveCurrentFrame() {

    frames[currentFrame].ctx.clearRect(0, 0, frames[currentFrame].newFrame.width, frames[currentFrame].newFrame.height);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = displayCanvas.width;
    tempCanvas.height = displayCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.lineWidth = brushSize;
    tempCtx.strokeStyle = displayCtx.strokeStyle;
    tempCtx.lineCap = displayCtx.lineCap;

    for (let item of getCurrentStrokes()) {
        if (item.type === "clear") {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            continue;
        }
        else {
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
    let x = e.offsetX;
    let y = e.offsetY;

    if (currentShape !== "none") {
        // Draw selected shape as a stamp
        const path = getShapePath(currentShape, x, y, brushSize * 4); // adjust size multiplier as you like
        displayCtx.strokeStyle = currentColor;
        displayCtx.lineWidth = 2;
        displayCtx.stroke(path);

        frameStrokes[currentFrame].push({
            path: path,
            color: currentColor,
            lineWidth: 2,
        });
        frameUndoneStrokes[currentFrame] = [];
        saveCurrentFrame();
        return; // don't enter free-draw mode
    }

    // Otherwise, start free drawing
    drawing = true;
    currentPath = new Path2D();
    displayCtx.lineWidth = brushSize;
    displayCtx.strokeStyle = currentColor;
    currentPath.moveTo(x, y);
    trackSvgPath("M", x, y);
});


displayCanvas.addEventListener("mousemove", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;

    if (drawing) {

        currentPath.lineTo(x, y);
        displayCtx.stroke(currentPath);
        trackSvgPath("L", x, y);
    }
});

displayCanvas.addEventListener("mouseup", (e) => {
    if (drawing && currentPath) {
        frameStrokes[currentFrame].push({
            path: currentPath,
            color: currentColor,
            lineWidth: brushSize
        });
        frameUndoneStrokes[currentFrame] = [];
        console.log(svg);
    }
    drawing = false;
});

displayCanvas.addEventListener("mouseleave", (e) => {
    if (drawing && currentPath) {
        frameStrokes[currentFrame].push({
            path: currentPath,
            color: currentColor,
            lineWidth: brushSize
        });
        frameUndoneStrokes[currentFrame] = [];
        console.log(svg);
    }
    drawing = false;
});

//SVG tracing function
let svg = "";
function trackSvgPath(key, x, y) {
    svg += `${key}${x} ${y} `;
}

//SVG download button
const downloadBtn = document.getElementById("download");
downloadBtn.addEventListener("click", async () => {
    let svgTag = ' width="400px" height="400px" xmlns="http://www.w3.org/2000/svg"';
    let finalSvg = `<svg ${svgTag}> <path d="${svg}" stroke-width="10" stroke="black" stroke-linecap="round" fill="none"/></svg>`; // CHANGE ATTRIBUTES TO USER PREFERENCES
    const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
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
function addFrame(frame) {
    frames.push(frame);
    totalFrames = frames.length;
}

function createFrame() {
    const newFrame = document.createElement("canvas");
    newFrame.height = displayCanvas.clientHeight;
    newFrame.width = displayCanvas.clientWidth;
    const ctx = newFrame.getContext("2d");

    return { newFrame, ctx };
}



const currFrameDisplay = document.getElementById("frameNum");
let currentFrame = 0;
let totalFrames = frames.length;
let shownFrameNum = 0;

function updateShownFrameNum() {
    shownFrameNum = currentFrame + 1;
}

function updateCurrFrameDisplay(num) {
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
    if (currentFrame + 1 >= totalFrames) {
        let nextFrame = createFrame();
        addFrame(nextFrame);
        frameStrokes.push([]);
        frameUndoneStrokes.push([]);
        currentFrame += 1;
        updateShownFrameNum();
        updateCurrFrameDisplay(shownFrameNum);
        displayFrame(currentFrame);
    }
    else {
        currentFrame += 1;
        updateShownFrameNum();
        updateCurrFrameDisplay(shownFrameNum);
        displayFrame(currentFrame);
    }
});

const prevBtn = document.getElementById("prevFrame");
prevBtn.addEventListener("click", () => {
    saveCurrentFrame();
    if (currentFrame > 0) {
        currentFrame -= 1;
        updateShownFrameNum();
        updateCurrFrameDisplay(shownFrameNum);
        displayFrame(currentFrame);
    }
    else {
        return;
    }
});



//animation functionality
const playBtn = document.getElementById("play");
const stopBtn = document.getElementById("stop");
const fpsInput = document.getElementById("fpsInput");
const loopBtn = document.getElementById("loop");



let playing = false;
let looping = false
let fps = 12;
let frameInterval = 1000 / fps;
let playBack = 0;
let animationId = null;
let lastTime = 0;

fpsInput.addEventListener("input", () => {
    if (playing) {
        return
    }
    fps = parseInt(fpsInput.value);
    frameInterval = 1000 / fps;
    console.log("FPS:", fps);
});

loopBtn.addEventListener("click", () => {
    looping = !looping;
});

function runAnimation(timestamp) {
    if (!playing) {
        return;
    }
    if (timestamp - lastTime > frameInterval) {
        lastTime = timestamp;

        const frame = frames[playBack];
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.drawImage(frame.newFrame, 0, 0);

        updateCurrFrameDisplay(playBack + 1);
        playBack += 1;
        if (playBack >= totalFrames) {
            if (looping) {
                playBack = 0;
            } else {
                stop();
                console.log("stopped animation");
                return;
            }
        }
    }
    requestAnimationFrame(runAnimation);
}

playBtn.addEventListener("click", () => {
    if (!playing) {
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
function stop() {
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
function deleteFrame(i) {
    console.log("Current frame index:", currentFrame, "Total frames:", frames.length);

    if (frames.length == 1) {
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

    if (currentFrame >= frames.length) {
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
    if (usingOnion) {
        onionSkin();
    }
    else {
        redrawFrame();
    }
});

function onionSkin() {
    if (currentFrame == 0) {
        return;
    }

    for (let item of getCurrentStrokes()) {
        if (item.type === "clear") {
            displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            continue;
        }
        else {
            displayCtx.strokeStyle = item.color;
            displayCtx.lineWidth = item.lineWidth;
            displayCtx.stroke(item.path);
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
        if (playing) {
            stop();
        }
    } else {
        displayCanvas.style.display = 'block';
        editor.style.display = 'none';
    }
});

//changing color


let currentColor = "black";
const colorBtn = document.getElementById("colorBtn");

colorBtn.addEventListener("click", () => {
    // Programmatically open the color picker
    colorInput.click();
});
colorInput.addEventListener("input", (e) => {
    setDrawingColor(e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {

    Coloris({
        defaultColor: '#000000',
        el: '#colorInput', // attach to input element
        theme: 'pill',
        format: 'rgb',
        placement: 'left',
        hideArrow: true,
        swatches: [
            '#264653',
            '#2a9d8f',
            '#e9c46a',
            'rgb(244,162,97)',
            '#e76f51',
            '#d62828',
            'navy',
            '#07b',
            '#0096c7',
            '#00b4d880',
            'rgba(0,119,182,0.8)'
        ],
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


//ZOOMING

const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomResetBtn = document.getElementById("zoomReset");

let zoomLevel = 1;
let panX = 0;
let panY = 0;



function applyCanvasZoom() {
    displayCanvas.style.transform = `scale(${zoomLevel})`;
}

zoomInBtn.addEventListener("click", () => {
    zoomLevel *= 1.2;
    applyCanvasZoom();
});

zoomOutBtn.addEventListener("click", () => {
    zoomLevel /= 1.2;
    if (zoomLevel < 0.1) zoomLevel = 0.1;
    applyCanvasZoom();
});

zoomResetBtn.addEventListener("click", () => {
    zoomLevel = 1;
    applyCanvasZoom();
});

window.addEventListener('DOMContentLoaded', function () {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        window.editor = monaco.editor.create(document.getElementById('editor'), {
            value: '/*\n Your SVG will appear below\n Editing your SVG will reflect on the canvas\n*/',
            language: 'javascript',
            theme: 'vs-dark',
            fontFamily: 'Fira Code, monospace',
            fontSize: 14,
            lineHeight: 22,
            automaticLayout: true,
            readOnly: false,
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            renderWhitespace: 'all',
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            padding: { left: 10, right: 10, top: 10, bottom: 10 },
        });
    });
});



const shapesBtn = document.getElementById("shapes");

//stamps
function circleStamp(x, y, size) {
    const path = new Path2D();
    path.arc(x, y, size / 2, 0, 2 * Math.PI);
    return path;
}

function squareStamp(x, y, size) {
    const path = new Path2D();
    path.rect(x - size / 2, y - size / 2, size, size);
    return path;
}

function triangleStamp(x, y, size) {
    const path = new Path2D();
    const h = size * Math.sqrt(3) / 2;
    path.moveTo(x, y - (2 / 3) * h);
    path.lineTo(x - size / 2, y + h / 3);
    path.lineTo(x + size / 2, y + h / 3);
    path.closePath();
    return path;
}


function starStamp(x, y, size) {
    const path = new Path2D();
    const outer = size / 2;
    const inner = outer * 0.5;
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = angle + Math.PI / 5;
        const x1 = x + outer * Math.cos(angle);
        const y1 = y + outer * Math.sin(angle);
        const x2 = x + inner * Math.cos(innerAngle);
        const y2 = y + inner * Math.sin(innerAngle);
        if (i === 0) path.moveTo(x1, y1);
        path.lineTo(x2, y2);
        path.lineTo(x1, y1);
    }
    path.closePath();
    return path;
}



function heartStamp(x, y, size) {
    const path = new Path2D();
    const topCurveHeight = size * 0.3;
    path.moveTo(x, y + size / 4);
    path.bezierCurveTo(
        x, y,
        x - size / 2, y,
        x - size / 2, y + topCurveHeight
    );
    path.bezierCurveTo(
        x - size / 2, y + size / 2,
        x, y + size / 1.5,
        x, y + size
    );
    path.bezierCurveTo(
        x, y + size / 1.5,
        x + size / 2, y + size / 2,
        x + size / 2, y + topCurveHeight
    );
    path.bezierCurveTo(
        x + size / 2, y,
        x, y,
        x, y + size / 4
    );
    path.closePath();
    return path;
}

function diamondStamp(x, y, size) {
    const path = new Path2D();
    path.moveTo(x, y - size / 2);
    path.lineTo(x - size / 2, y);
    path.lineTo(x, y + size / 2);
    path.lineTo(x + size / 2, y);
    path.closePath();
    return path;
}

function getShapePath(shape, x, y, size) {
    switch (shape) {
        case "circle": return circleStamp(x, y, size);
        case "square": return squareStamp(x, y, size);
        case "triangle": return triangleStamp(x, y, size);
        case "heart": return heartStamp(x, y, size);
        case "diamond": return diamondStamp(x, y, size);
        default: return null;
    }
}


const shapeSelector = document.getElementById("shapeSelector");
let currentShape = "none";

shapeSelector.addEventListener("change", (e) => {
    currentShape = e.target.value;
    console.log("Shape selected:", currentShape);
});

