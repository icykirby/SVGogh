//canavs setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

//drawing settings
ctx.lineWidth = 10;
ctx.strokeStyle = "black";
ctx.lineCap = "round";

////drawing functions
let drawing = false;
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    let x = e.offsetX;
    let y = e.offsetY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    trackSvgPath("M", x, y);
});

canvas.addEventListener("mousemove", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;

    if(drawing){
        ctx.lineTo(x, y);
        ctx.stroke();
        trackSvgPath("L", x, y);
    }
});

canvas.addEventListener("mouseup", (e) => {
    drawing = false;
});

canvas.addEventListener("mouseleave", (e) => {
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
    let finalSvg = `<svg ${svgTag}> <path d="${svg}" stroke-width="10" stroke="black" stroke-linecap="round" fill="none"/></svg>`;
    const blob = new Blob([finalSvg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = 'text.svg';
    a.click();
    URL.revokeObjectURL(a.href);
});