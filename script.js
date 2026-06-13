// let modebtn = document.querySelector("#mode");
// let currentMode = "light";

// modebtn.addEventListener("click", () => {
//     if (currentMode === "light") {
//         currentMode = "dark";
//         document.querySelector("body").style.backgroundColor = "black";
//     } else {
//         currentMode = "light";
//         document.querySelector("body").style.backgroundColor = "white";
//     }

//     console.log(currentMode);
// });



// Asynchronous ;;


// function hello(){
// console.log("hello");
// }

// setTimeout(hello,2000 )

// console.log("1");
// console.log("2");

// setTimeout(() =>
// {
//     console.log("hello!");        
// } , 1000
// );

// console.log("3");
// console.log("4");

// Callbacks Hell ;;

// function getData (dataId , getNextData){
//     setTimeout(() => {
//         console.log("data" , dataId );
//     if(getNextData){
//         getNextData();
//     }
//     } , 2000);
// }

// getData(1 ,()=>{
// getData(2,()=>{
//     getData(3)
// }
// );
// });

// let promise = new Promise((resolve,reject) =>{
//     console.log("Promise made !");
//     reject("error occured");
// } )

// async function hello(){
// console.log("hello");
// }

console.log("JS is working");

const slides = document.querySelectorAll(".slide");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let currentSlide = 0;

function showSlide(index){

    slides.forEach(slide => {
        slide.classList.remove("active");
    });

    slides[index].classList.add("active");
}

nextBtn.addEventListener("click", () => {

    currentSlide++;

    if(currentSlide >= slides.length){
        currentSlide = 0;
    }

    showSlide(currentSlide);
});

prevBtn.addEventListener("click", () => {

    currentSlide--;

    if(currentSlide < 0){
        currentSlide = slides.length - 1;
    }

    showSlide(currentSlide);
});

/* AUTO SLIDER */

setInterval(() => {

    currentSlide++;

    if(currentSlide >= slides.length){
        currentSlide = 0;
    }

    showSlide(currentSlide);

}, 10000);