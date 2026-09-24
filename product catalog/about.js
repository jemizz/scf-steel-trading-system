const track = document.querySelector(".album-track");
const slides = document.querySelectorAll(".album-slide");
const dots = document.querySelectorAll(".album-dot");

const previousButton = document.querySelector(".album-prev");
const nextButton = document.querySelector(".album-next");

let currentSlide = 0;


/* =========================
   UPDATE ALBUM
========================= */

function updateAlbum() {

    const slide = slides[currentSlide];

    const slideWidth = slide.offsetWidth;
    const gap = 20;

    const albumWindow = document.querySelector(".album-window");
    const windowWidth = albumWindow.offsetWidth;

    /*
        Moves the selected picture toward
        the center of the album.
    */

    const slidePosition =
        currentSlide * (slideWidth + gap);

    const centerOffset =
        (windowWidth / 2) - (slideWidth / 2);

    track.style.transform =
        `translateX(${centerOffset - slidePosition}px)`;


    /* Active Image */

    slides.forEach((item, index) => {

        item.classList.toggle(
            "active",
            index === currentSlide
        );

    });


    /* Active Dot */

    dots.forEach((dot, index) => {

        dot.classList.toggle(
            "active",
            index === currentSlide
        );

    });

}


/* =========================
   NEXT
========================= */

nextButton.addEventListener("click", () => {

    currentSlide++;

    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }

    updateAlbum();

});


/* =========================
   PREVIOUS
========================= */

previousButton.addEventListener("click", () => {

    currentSlide--;

    if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }

    updateAlbum();

});


/* =========================
   DOTS
========================= */

dots.forEach((dot, index) => {

    dot.addEventListener("click", () => {

        currentSlide = index;

        updateAlbum();

    });

});


/* =========================
   CLICK A PICTURE
========================= */

slides.forEach((slide, index) => {

    slide.addEventListener("click", () => {

        currentSlide = index;

        updateAlbum();

    });

});


/* =========================
   WINDOW RESIZE
========================= */

window.addEventListener("resize", updateAlbum);


/* Start Album */

updateAlbum();