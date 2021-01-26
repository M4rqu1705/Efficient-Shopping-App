// https://www.html5rocks.com/en/tutorials/getusermedia/intro/
// https://www.digitalocean.com/community/tutorials/front-and-rear-camera-access-with-javascripts-getusermedia
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
// https://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/

const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const photo = document.getElementById("photo");
const processedPicture = document.getElementById("processed");
const startButton = document.getElementById("startButton");

let width = 240;
let height;
let streaming;
let settings;


let desiredHSL = {
    "min_hue": 200,
    "max_hue": 220,
    "min_sat": 0.3,
    "max_sat": 1.0,
    "min_lum": 0,
    "max_lum": 1.0
}


function customInputSlider(lbl, name, setter, getter, min, max, step) {
    let label = document.createElement('label');
    label.innerText = lbl;
    label.id = `${name}Label`;

    let input = document.createElement('input');
    input.type = 'number';
    input.value = getter();
    input.id = `${name}Input`;

    let slider = document.createElement('input');
    slider.type = 'range';
    slider.value = getter();
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.id = `${name}Slider`;

    input.addEventListener('input', function (event) {
        setter(Number(document.getElementById(`${name}Input`).value));
        document.getElementById(`${name}Slider`).value = getter();
    });

    slider.addEventListener('input', function (event) {
        setter(Number(document.getElementById(`${name}Slider`).value));
        document.getElementById(`${name}Input`).value = getter();
    });

    let container = document.createElement('div');
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(document.createElement('br'));
    container.appendChild(slider);
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createElement('br'));


    return container;

}



function rgb2hsl(red, green, blue) {
    red /= 255;
    green /= 255;
    blue /= 255;

    let min = Math.min(red, green, blue);
    // let min_color = (red === min) ? "red" : (green === min) ? "green" : "blue";
    let max = Math.max(red, green, blue);
    let max_color = (red === max) ? "red" : (green === max) ? "green" : "blue";

    let luminance = (min + max) / 2;

    let saturation = 0;

    if (luminance > 0.5) {
        saturation = (max - min) / (2.0 - max - min);
    } else {
        saturation = (max - min) / (max + min);
    }

    let hue = 0;

    switch (max_color) {
        case "red":
            hue = (green - blue) / (max - min);
            break;
        case "green":
            hue = 2 + (blue - red) / (max - min);
            break;
        case "blue":
            hue = 4 + (red - green) / (max - min);
            break;
        default:
            hue = 0;
    }

    hue *= 60;

    if (hue < 0) {
        hue += 360
    }

    return [hue, saturation, luminance];
}

function debugRGB2HSL() {
    function setAttributes(el, attrs) {
        for (var key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
    }


    let div = document.createElement("div");
    div.classList.add("container");

    let rgbContainer = document.createElement("div");
    rgbContainer.classList.add("colorContainer");
    rgbContainer.id = "rgbContainer";

    let hslContainer = document.createElement("div");
    hslContainer.classList.add("colorContainer");
    hslContainer.id = "hslContainer";


    const sliderOpts = {
        "type": "range",
        "min": 0,
        "max": 255,
        "value": 0,
        "class": "slider"
    }

    let sliderRed = document.createElement("input");
    let sliderGreen = document.createElement("input");
    let sliderBlue = document.createElement("input");

    setAttributes(sliderRed, sliderOpts);
    setAttributes(sliderGreen, sliderOpts);
    setAttributes(sliderBlue, sliderOpts);

    sliderRed.id = "sliderRed";
    sliderGreen.id = "sliderGreen";
    sliderBlue.id = "sliderBlue";

    function handler(event) {
        let r = document.getElementById("sliderRed").value;
        let g = document.getElementById("sliderGreen").value;
        let b = document.getElementById("sliderBlue").value;

        r = Number(r);
        g = Number(g);
        b = Number(b);

        document.getElementById("rgbContainer").style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        const [h, s, l] = rgb2hsl(r, g, b);
        document.getElementById("hslContainer").style.backgroundColor = `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
        console.log(`hsl(${h}, ${s * 100}%, ${l * 100}%)`);
    }

    sliderRed.addEventListener("input", handler);
    sliderGreen.addEventListener("input", handler);
    sliderBlue.addEventListener("input", handler);


    div.appendChild(rgbContainer);
    div.appendChild(hslContainer);
    div.appendChild(sliderRed);
    div.appendChild(sliderGreen);
    div.appendChild(sliderBlue);

    document.body.appendChild(div);
}

function changeVideoFeed() {

    function isAvailable() {
        return !!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
    }

    if (isAvailable()) {
        navigator.mediaDevices.getUserMedia(settings)
            .then(stream => {
                window.stream = stream;
                video.srcObject = stream;
            });

    } else {
        alert("Camera is not accessible");
        streaming = false;
    }

}

function prepareButtons() {
    navigator.mediaDevices.enumerateDevices().then(device => {
        for (let d of device) {
            if (d.kind === 'videoinput') {

                const button = document.createElement('button');
                button.innerText = d.label;

                button.addEventListener('click', function () {
                    settings.video.deviceId = d.deviceId;
                    settings.video.groupId = d.groupId;
                    document.body.appendChild(button);
                });

            }
        }
    });
}

function clearPhoto() {
    let context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
    processed.setAttribute('src', data);
}

function takePicture() {
    let context = canvas.getContext('2d');

    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        let data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
    } else {
        clearPhoto();
    }
}

function processPicture() {

    let context = canvas.getContext('2d');

    let image = context.getImageData(0, 0, canvas.width, canvas.height);

    function getColorIndicesForCoord(x, y, image) {
        const red_index = y * image.width * 4 + x * 4;

        return [
            image.data[red_index],
            image.data[red_index + 1],
            image.data[red_index + 2],
            image.data[red_index + 3]
        ];
    }

    function grayFilter(image) {
        const l0 = image.data.length;

        for (let i = 0; i < l0; i += 4) {
            let [r, g, b, a] = [
                image.data[i],
                image.data[i + 1],
                image.data[i + 2],
                image.data[i + 3]
            ]

            const avg = (r + g + b) / 3;

            image.data[i] = avg;
            image.data[i + 1] = avg;
            image.data[i + 2] = avg;
            image.data[i + 3] = avg;
        }

        return image;
    }

    function redFilter(image) {
        const l0 = image.data.length;

        for (let i = 0; i < l0; i += 4) {
            let [r, g, b, a] = [
                image.data[i],
                image.data[i + 1],
                image.data[i + 2],
                image.data[i + 3]
            ]

            image.data[i + 1] = 0;
            image.data[i + 2] = 0;
        }

        return image;
    }

    function greenFilter(image) {
        const l0 = image.data.length;

        for (let i = 0; i < l0; i += 4) {
            let [r, g, b, a] = [
                image.data[i],
                image.data[i + 1],
                image.data[i + 2],
                image.data[i + 3]
            ]

            image.data[i] = 0;
            image.data[i + 2] = 0;
        }

        return image;
    }

    function blueFilter(image) {
        const l0 = image.data.length;

        for (let i = 0; i < l0; i += 4) {
            let [r, g, b, a] = [
                image.data[i],
                image.data[i + 1],
                image.data[i + 2],
                image.data[i + 3]
            ]

            image.data[i] = 0;
            image.data[i + 1] = 0;
        }

        return image;
    }

    function hslFilter(image) {
        const l0 = image.data.length;
        let mask = new Array(l0);

        for (let i = 0; i < l0; i += 4) {
            let [r, g, b, a] = [
                image.data[i],
                image.data[i + 1],
                image.data[i + 2],
                image.data[i + 3]
            ]

            const [h, s, l] = rgb2hsl(r, g, b);

            if (desiredHSL.min_sat <= s && s <= desiredHSL.max_sat &&
                desiredHSL.min_lum <= l && l <= desiredHSL.max_lum
            ) {
                if (
                    desiredHSL.min_hue <= desiredHSL.max_hue &&
                    desiredHSL.min_hue <= h &&
                    h <= desiredHSL.max_hue
                ) {
                    // console.log(`R: ${image.data[i]}, G: ${image.data[i + 1]}, B: ${image.data[i + 2]}`);
                    mask[i / 4] = 1;
                } else {
                    mask[i / 4] = 0;
                }
            } else {
                mask[i / 4] = 0;
            }

        }

        return mask;
    }

    function contourDetection(mask, kernel_size, width, height, threshold = 0.5) {

        let outputMask = [];
        for (let i = 0; i < mask.length; i++) outputMask[i] = 0;

        for (let x = 0; x < width - kernel_size; x++) {
            for (let y = 0; y < height - kernel_size; y++) {

                let total = 0;
                let indices = [];
                const index = y * width + x;

                for (let i = 0; i < kernel_size; i++) {
                    for (let j = 0; j < kernel_size; j++) {
                        total += mask[index + j * width + i];
                        indices.push(index + j * width + i);
                    }
                }

                if (total / (kernel_size * kernel_size) >= threshold) {
                    for (let i = 0; i < indices.length; i++) {
                        outputMask[indices[i]] = 1;
                    }
                }

            }
        }

        return outputMask;

    }

    function applyMask(image, mask, color) {
        const l0 = image.data.length;

        for (let i = 0; i < l0; i += 4) {
            if (mask[i / 4] === 1) {
                image.data[i] = color[0];
                image.data[i + 1] = color[1];
                image.data[i + 2] = color[2];
            }

        }

        return image;
    }

    mask = hslFilter(image);
    mask = contourDetection(mask, 4, image.width, image.height, 0.3);
    image = applyMask(image, mask, [0, 255, 255]);

    context.putImageData(image, 0, 0);
    processed.setAttribute('src', canvas.toDataURL('image/png'));



}


function startUp() {
    height = 0;
    streaming = false;

    settings = {
        video: {
            width: {
                min: width,
                max: 4 * width,
            },
            height: {
                min: width,
                max: 4 * width
            },
        }
    };

    changeVideoFeed();

    video.addEventListener('canplay', function (event) {
        if (!streaming) {
            height = width * (video.videoHeight / video.videoWidth);

            video.setAttribute('width', width);
            video.setAttribute('height', height);
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);

            streaming = true;

        }
    }, false);

    startButton.addEventListener('click', function (event) {
        takePicture();
        processPicture();
        event.preventDefault();
    }, false);

    let inputs = document.getElementsByClassName('inputs')[0];

    inputs.appendChild(customInputSlider("Smallest Hue", 'minHue',
        (value) => { desiredHSL.min_hue = value },
        () => desiredHSL.min_hue,
        0, 360, 1));
    inputs.appendChild(customInputSlider("Biggest Hue", 'maxHue',
        (value) => { desiredHSL.max_hue = value },
        () => desiredHSL.max_hue,
        0, 360, 1));

    inputs.appendChild(customInputSlider("Smallest Saturation", 'minSat',
        (value) => { desiredHSL.min_sat = value },
        () => desiredHSL.min_sat,
        0, 1, 0.01));
    inputs.appendChild(customInputSlider("Biggest Saturation", 'maxSat',
        (value) => { desiredHSL.max_sat = value },
        () => desiredHSL.max_sat,
        0, 1, 0.01));

    inputs.appendChild(customInputSlider("Smallest Luminance", 'minLum',
        (value) => { desiredHSL.min_lum = value },
        () => desiredHSL.min_lum,
        0, 1, 0.01));
    inputs.appendChild(customInputSlider("Biggest Luminance", 'maxLum',
        (value) => { desiredHSL.max_lum = value },
        () => desiredHSL.max_lum,
        0, 1, 0.01));

    clearPhoto();

    setInterval(() => {
        takePicture();
        processPicture();
    }, 100);

}

startUp();
