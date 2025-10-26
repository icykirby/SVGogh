// Navbar shrink
const navbar = document.querySelector('.navbar');
const logo = document.querySelector(".navbar__logo img");

window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
        navbar.classList.add('shrink');
        logo.src = "img/SVGogh_Color.png";
    } else {
        navbar.classList.remove('shrink');
        logo.src = "img/SVGogh_White.png";
    }
});

// FAQ section
var questions = document.querySelectorAll(".faq-question");

// for loop to go through index.
for (var i = 0; i < questions.length; i++) {
    questions[i].addEventListener("click", function () {
        var answer = this.nextElementSibling;
        this.classList.toggle("active");
        answer.classList.toggle("show");
    });
}



// Initialize particles.js
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#ffffff" },
        "shape": {
            "type": "circle",
            "stroke": { "width": 0, "color": "#000000" },
            "polygon": { "nb_sides": 5 },
            "image": { "src": "img/github.svg", "width": 100, "height": 100 }
        },
        "opacity": { "value": 1, "random": false, "anim": { "enable": true, "speed": 1.95, "opacity_min": 0.1, "sync": false } },
        "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } },
        "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
        "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false } }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": { "onhover": { "enable": false }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
        "modes": { "grab": { "distance": 400 }, "bubble": { "distance": 400 }, "repulse": { "distance": 200 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } }
    },
    "retina_detect": true
});

// Initialize stats.js
var stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

var count_particles = document.querySelector('.js-count-particles');

function update() {
    stats.begin();
    stats.end();
    if (window.pJSDom[0].pJS.particles && window.pJSDom[0].pJS.particles.array) {
        count_particles.innerText = window.pJSDom[0].pJS.particles.array.length;
    }
    requestAnimationFrame(update);
}

requestAnimationFrame(update);

particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80 },
        "color": { "value": "#ffffff" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5 },
        "size": { "value": 3 },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 4,
            "direction": "none",
            "out_mode": "out"
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": { "enable": true, "mode": "grab" },
            "onclick": { "enable": true, "mode": "push" }
        },
        "modes": {
            "grab": { "distance": 140, "line_linked": { "opacity": 1 } },
            "push": { "particles_nb": 4 }
        }
    },
    "retina_detect": true
});