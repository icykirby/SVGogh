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
let framePaths = [[]];
let frameUndonePaths = [[]];
let currentPath;
let pathIndex = -1;

function getCurrentStrokes() {
    return frameStrokes[currentFrame];
}

function getCurrentUndoneStrokes() {
    return frameUndoneStrokes[currentFrame];
}
const undoBtn = document.getElementById("undo");
undoBtn.addEventListener("click", () => {
    const strokes = getCurrentStrokes();
    const undoneStrokes = getCurrentUndoneStrokes();

    if (strokes.length === 0) return;

    // pop last stroke and its path
    const lastStroke = strokes.pop();
    const lastPath = framePaths[currentFrame].pop();

    undoneStrokes.push(lastStroke);
    frameUndonePaths[currentFrame].push(lastPath);

    redrawFrame();
    updateEditorWithSvg();
});

const redoBtn = document.getElementById("redo");
redoBtn.addEventListener("click", () => {
    const undoneStrokes = getCurrentUndoneStrokes();
    if (undoneStrokes.length === 0) return;

    const stroke = undoneStrokes.pop();
    const path = frameUndonePaths[currentFrame].pop();

    frameStrokes[currentFrame].push(stroke);
    framePaths[currentFrame].push(path);

    redrawFrame();
    updateEditorWithSvg();
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
    console.log(framePaths);
}
function displayFrame(frameIndex) {
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    if (usingOnion && frameIndex > 0) {
        displayCtx.save();
        displayCtx.globalAlpha = 0.3;
        const prevFrame = frames[frameIndex - 1];
        if (prevFrame) {
            displayCtx.drawImage(prevFrame.newFrame, 0, 0);
        }
        displayCtx.restore();
    }


    const strokes = frameStrokes[frameIndex];
    if (strokes) {
        strokes.forEach(s => {
            displayCtx.strokeStyle = s.color;
            displayCtx.lineWidth = s.lineWidth;
            displayCtx.stroke(s.path);
        });
    }

    if (window.editor) {
        const paths = framePaths[frameIndex] || [];
        const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">\n`;
        const svgBody = paths.join("\n");
        const svgFooter = `\n</svg>`;
        window.editor.setValue(svgHeader + svgBody + svgFooter);
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
const shapeSelector = document.getElementById("shapeSelector");
let currentShape = "none";

shapeSelector.addEventListener("change", (e) => {
    currentShape = e.target.value;
    console.log("Shape selected:", currentShape);
});

////drawing functions -- CHANGE FOR TOUCH AND STYLUS SUPPORT
let drawing = false;
displayCanvas.addEventListener("mousedown", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;

    if (currentShape !== "none") {

        const path = getShapePath(currentShape, x, y, brushSize * 4);
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


        const svgTag = shapeToSvgPath(currentShape, x, y, brushSize * 4, currentColor, 2);
        if (!framePaths[currentFrame]) framePaths[currentFrame] = [];
        framePaths[currentFrame].push(svgTag);
        updateEditorWithSvg();

        updateEditorWithSvg();

        return;
    }



    drawing = true;
    currentPath = new Path2D();
    displayCtx.lineWidth = brushSize;
    displayCtx.strokeStyle = currentColor;
    currentPath.moveTo(x, y);
    startSvgPath(x, y, currentColor, brushSize);

});


displayCanvas.addEventListener("mousemove", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;

    if (drawing) {

        currentPath.lineTo(x, y);
        displayCtx.stroke(currentPath);
        extendSvgPath(x, y);

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

        endSvgPath();
        pathIndex += 1;
        console.log(pathIndex);
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
        pathIndex += 1;

        endSvgPath();

    }
    drawing = false;
});

let svgPaths = [];
let currentSvgPath = "";

function startSvgPath(x, y, color, width) {
    currentSvgPath = `M${x} ${y}`;
    currentPathColor = color;
    currentPathWidth = width;
}

function extendSvgPath(x, y) {
    currentSvgPath += ` L${x} ${y}`;
}

function endSvgPath() {
    const pathTag = `<path d="${currentSvgPath}" stroke="${currentPathColor}" stroke-width="${currentPathWidth}" stroke-linecap="round" fill="none"/>`;


    if (!framePaths[currentFrame]) framePaths[currentFrame] = [];


    framePaths[currentFrame].push(pathTag);

    console.log(currentSvgPath);
    console.log(pathTag);


    updateEditorWithSvg();


    currentSvgPath = "";
}

let updateTimeout = null;
function updateEditorWithSvg() {
    if (!window.editor) return;
    clearTimeout(updateTimeout);

    updateTimeout = setTimeout(() => {
        const currentFramePaths = framePaths[currentFrame] || [];
        const svgHeader = `<svg width="400px" height="400px" xmlns="http://www.w3.org/2000/svg">\n`;
        const svgContent = currentFramePaths.join("\n");
        const svgFooter = `\n</svg>\n`;

        window.editor.setValue(`${svgHeader}${svgContent}${svgFooter}`);
    }, 200);
}

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


const downloadBtn = document.getElementById("download");
downloadBtn.addEventListener("click", async () => {
    if (!framePaths || framePaths.length === 0) {
        alert("No frames to export!");
        return;
    }

    const hasContent = framePaths.some(paths => paths && paths.length > 0);
    if (!hasContent) {
        alert("No drawing content to export!");
        return;
    }

    const width = displayCanvas.width;
    const height = displayCanvas.height;

    const frameDuration = 1 / (fps || 12);
    const totalFrames = framePaths.length;
    const totalDuration = totalFrames * frameDuration;

    // Create SVG header with proper viewBox
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n<defs>\n`;

    // Define symbols
    framePaths.forEach((paths, i) => {
        const id = `frame${i + 1}`;
        const content = paths.join("\n");
        svg += `  <symbol id="${id}">\n${content}\n  </symbol>\n`;
    });

    svg += `</defs>\n\n`;

    // Add frames using <use>
    framePaths.forEach((_, i) => {
        const id = `u${i + 1}`;
        const frameRef = `#frame${i + 1}`;
        const visibility = i === 0 ? "visible" : "hidden";
        svg += `  <use id="${id}" href="${frameRef}" visibility="${visibility}"/>\n`;
    });

    // Animate visibility for playback
    framePaths.forEach((_, i) => {
        const begin = i * frameDuration;
        const next = (i + 1) % totalFrames;
        const currentUse = `#u${i + 1}`;
        const nextUse = `#u${next + 1}`;

        svg += `  <set href="${currentUse}" attributeName="visibility" to="hidden" begin="loop.begin+${(begin + frameDuration).toFixed(3)}s" dur="0.001s" fill="freeze"/>\n`;
        svg += `  <set href="${nextUse}" attributeName="visibility" to="visible" begin="loop.begin+${(begin + frameDuration).toFixed(3)}s" dur="0.001s" fill="freeze"/>\n`;
    });

    svg += `  <animate id="loop" attributeName="visibility" from="hidden" to="hidden" begin="0s;loop.end" dur="${totalDuration}s" fill="freeze"/>\n`;
    svg += `</svg>`;

    // Trigger download
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animated_drawing.svg";
    a.click();
    URL.revokeObjectURL(url);
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




///delete frame
const deleteBtn = document.getElementById("deleteFrame");
deleteBtn.addEventListener("click", () => {
    deleteFrame(currentFrame);
});

function deleteFrame(i) {
    console.log("Current frame index:", currentFrame, "Total frames:", frames.length);

    // If only one frame left, just clear it
    if (frames.length === 1) {
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

        // Reset all arrays for the single frame
        frameStrokes[0] = [];
        frameUndoneStrokes[0] = [];
        framePaths[0] = [];
        frameUndonePaths[0] = [];

        saveCurrentFrame();
        return;
    }


    frames.splice(i, 1);
    frameStrokes.splice(i, 1);
    frameUndoneStrokes.splice(i, 1);
    framePaths.splice(i, 1);
    frameUndonePaths.splice(i, 1);

    totalFrames = frames.length;


    if (currentFrame >= frames.length) {
        currentFrame = frames.length - 1;
    }


    updateShownFrameNum();
    updateCurrFrameDisplay(shownFrameNum);
    displayFrame(currentFrame);


    updateEditorWithSvg();

    console.log("Frame deleted");
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
    const editorVisible = window.getComputedStyle(editor).display !== 'none';

    if (!editorVisible) {

        displayCanvas.style.display = 'none';
        editor.style.display = 'block';
        if (playing) stop();
    } else {

        displayCanvas.style.display = 'block';
        editor.style.display = 'none';


        if (window.editor && typeof window.editor.getValue === 'function') {
            applyMonacoEditsToFramePaths();
            applyMonacoEditsToCanvas();
        }
    }
});


//changing color


let currentColor = "black";
const colorBtn = document.getElementById("colorBtn");

colorBtn.addEventListener("click", () => {

    colorInput.click();
});
colorInput.addEventListener("input", (e) => {
    setDrawingColor(e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {

    Coloris({
        defaultColor: '#000000',
        el: '#colorInput',
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
            value: '/*\n Your SVG will appear below once you draw on the canvas\n*/',
            language: 'xml',
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




shapesBtn.addEventListener("click", () => {
    shapeSelector.classList.toggle("open");
    shapeSelector.focus();
    shapeSelector.click();
});

function shapeToSvgPath(shape, x, y, size, color, width) {
    switch (shape) {
        case "circle":
            return `<circle cx="${x}" cy="${y}" r="${size / 2}" stroke="${color}" stroke-width="${width}" fill="none" />`;
        case "square":
            return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" stroke="${color}" stroke-width="${width}" fill="none" />`;
        case "triangle": {
            const h = size * Math.sqrt(3) / 2;
            const p1 = `${x},${y - (2 / 3) * h}`;
            const p2 = `${x - size / 2},${y + h / 3}`;
            const p3 = `${x + size / 2},${y + h / 3}`;
            return `<polygon points="${p1} ${p2} ${p3}" stroke="${color}" stroke-width="${width}" fill="none" />`;
        }
        case "heart": {

            const topCurveHeight = size * 0.3;
            const d = `
          M ${x},${y + size / 4}
          C ${x},${y} ${x - size / 2},${y} ${x - size / 2},${y + topCurveHeight}
          C ${x - size / 2},${y + size / 2} ${x},${y + size / 1.5} ${x},${y + size}
          C ${x},${y + size / 1.5} ${x + size / 2},${y + size / 2} ${x + size / 2},${y + topCurveHeight}
          C ${x + size / 2},${y} ${x},${y} ${x},${y + size / 4}
          Z
        `;
            return `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" />`;
        }
        case "diamond":
            return `<polygon points="${x},${y - size / 2} ${x - size / 2},${y} ${x},${y + size / 2} ${x + size / 2},${y}" stroke="${color}" stroke-width="${width}" fill="none" />`;
        default:
            return "";
    }
}

function redrawFrameWithOnion() {
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);


    if (usingOnion && currentFrame > 0) {
        displayCtx.save();
        displayCtx.globalAlpha = 0.3;
        displayCtx.drawImage(frames[currentFrame - 1].newFrame, 0, 0);
        displayCtx.restore();
    }


    for (let item of getCurrentStrokes()) {
        if (item.type === "clear") {
            displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            continue;
        }
        displayCtx.strokeStyle = item.color;
        displayCtx.lineWidth = item.lineWidth;
        displayCtx.stroke(item.path);
    }
}

function applyMonacoEditsToCanvas() {
    if (!window.editor) return;

    const svgCode = window.editor.getValue();
    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgCode, "image/svg+xml");


        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        frameStrokes[currentFrame] = [];


        const allElements = svgDoc.querySelectorAll("path, circle, rect, polygon, ellipse, line, polyline");

        allElements.forEach(el => {
            let path2D;
            const stroke = el.getAttribute("stroke") || "black";
            const strokeWidth = parseFloat(el.getAttribute("stroke-width")) || 2;


            if (el.tagName === "path") {
                const d = el.getAttribute("d");
                path2D = new Path2D(d);
            } else if (el.tagName === "circle") {
                const cx = parseFloat(el.getAttribute("cx"));
                const cy = parseFloat(el.getAttribute("cy"));
                const r = parseFloat(el.getAttribute("r"));
                path2D = new Path2D();
                path2D.arc(cx, cy, r, 0, 2 * Math.PI);
            } else if (el.tagName === "rect") {
                const x = parseFloat(el.getAttribute("x"));
                const y = parseFloat(el.getAttribute("y"));
                const w = parseFloat(el.getAttribute("width"));
                const h = parseFloat(el.getAttribute("height"));
                path2D = new Path2D();
                path2D.rect(x, y, w, h);
            } else if (el.tagName === "polygon" || el.tagName === "polyline") {
                const points = el.getAttribute("points").trim().split(/\s+/);
                path2D = new Path2D();
                for (let i = 0; i < points.length; i += 2) {
                    const x = parseFloat(points[i]);
                    const y = parseFloat(points[i + 1]);
                    if (i === 0) path2D.moveTo(x, y);
                    else path2D.lineTo(x, y);
                }
                if (el.tagName === "polygon") path2D.closePath();
            }

            if (path2D) {
                displayCtx.strokeStyle = stroke;
                displayCtx.lineWidth = strokeWidth;
                displayCtx.stroke(path2D);

                frameStrokes[currentFrame].push({
                    path: path2D,
                    color: stroke,
                    lineWidth: strokeWidth,
                });
            }
        });


        saveCurrentFrame();
    } catch (e) {
        console.warn("Invalid SVG input in Monaco — could not render", e);
    }
}


function applyMonacoEditsToFramePaths() {
    if (!window.editor) return;

    const svgCode = window.editor.getValue();

    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgCode, "image/svg+xml");




        const allElements = svgDoc.querySelectorAll("path, circle, rect, polygon, ellipse, line, polyline");

        framePaths[currentFrame] = [];

        allElements.forEach(el => {
            framePaths[currentFrame].push(el.outerHTML);
        });



    } catch (e) {
        console.warn("Invalid SVG input in Monaco — could not sync", e);
    }
}
