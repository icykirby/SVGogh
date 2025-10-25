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
});

canvas.addEventListener("mousemove", (e) => {
    let x = e.offsetX;
    let y = e.offsetY;

    if(drawing){
        ctx.lineTo(x, y);
        ctx.stroke();
    }
});

canvas.addEventListener("mouseup", (e) => {
    drawing = false;
});

canvas.addEventListener("mouseleave", (e) => {
    drawing = false;
});