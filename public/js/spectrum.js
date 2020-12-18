let context = new AudioContext(),
    src = context.createMediaElementSource(audio),
    analyser = context.createAnalyser(),
    canvas = document.getElementById("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ctx = canvas.getContext("2d");

src.connect(analyser);
analyser.connect(context.destination);

analyser.fftSize = 256;

let bufferLength = analyser.frequencyBinCount;
console.log(bufferLength);

let dataArray = new Uint8Array(bufferLength),
    WIDTH = canvas.width,
    HEIGHT = canvas.height,
    barWidth = (WIDTH / bufferLength) * 2.5,
    barHeight,
    x = 0;

function renderFrame() {
    requestAnimationFrame(renderFrame);

    x = 0;

    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = "rgb(255,255,255)";

    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        let r = barHeight + (25 * (i / bufferLength)),
            g = 250 * (i / bufferLength),
            b = 50;

        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

renderFrame();