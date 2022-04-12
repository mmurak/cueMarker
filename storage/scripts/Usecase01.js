// Globals
let G = new GlobalManager();

// Wavesurfer setup
let wavesurfer = WaveSurfer.create({
    container: '#waveform' ,
    waveColor: '#6495ed',
    progressColor: '#b03a2e',
    backend: 'MediaElement'     // Speed change without affecting the pitch
});

wavesurfer.on("play", function() {
    G.playButton.value = "Pause";
    G.speedSelector.disabled = true;
});

wavesurfer.on("pause", function() {
    G.playButton.value = "Play";
    G.speedSelector.disabled = false;
});

wavesurfer.on("finish", function() {
    G.playButton.value = "Play";
    G.speedSelector.disabled = false;
});

// Stopwatch control
let timer = function() {
    G.timerField.value = (Math.floor(wavesurfer.getCurrentTime() * 100.0) / 100.0).toFixed(2);
    if (!wavesurfer.isPlaying()) {
        G.playButton.value = "Play";
    }
};
setInterval(timer, 10);

wavesurfer.on("audioprocess", function() {
    let time = wavesurfer.getCurrentTime();
    for (let i = 0; i < G.timingList.length - 1; i++) {
        let span = document.getElementById("span" + i);
        if ((Number(G.timingList[i]) <= time) && (time < Number(G.timingList[i+1]))) {
            span.style = "color: red;";
        } else {
            span.style = "color: black;";
        }
    }
});

// Called when Play/Pause button is pushed.
function playPause() {
    if (!wavesurfer.isPlaying()) {
        wavesurfer.play();
    } else {
        wavesurfer.pause();
    }
}

// Called when rewind 1 sec. button is pushed.
function rewind1second() {
    wavesurfer.skipBackward(1.0);
}

// Called when goto controll is activated.
function goto() {
    let field = G.secondsFromStart;
    wavesurfer.skip(field.value - wavesurfer.getCurrentTime());
}

// Called when speed-controll selector is changed.
function speedController(speed) {
    wavesurfer.setPlaybackRate(Number(speed));
}

// File reader
window.addEventListener('DOMContentLoaded', function() {
    G.inputFileButton.addEventListener("change",function(evt){
        let file = evt.target.files[0];
        let readerJSON = new FileReader();
        readerJSON.readAsText(file);
        readerJSON.onload = function () {
            let jsonData = JSON.parse(readerJSON.result);
            wavesurfer.load(jsonData["sound"]);
            G.timingList = jsonData["timing"];
            let transcript = jsonData["transcript"];
            transcript = transcript.replaceAll("\n", "<br/>");
            let html = "";
            transcript.split("▴").forEach(function (elem, idx) {
                html += "<span id='span" + idx + "'>" + elem + "</span>";
            });
            G.displayField.innerHTML = html;
        }
    },false);

    loadJSON(function(response) {
        let jsonData = JSON.parse(response);
        wavesurfer.load(jsonData["sound"]);
        G.timingList = jsonData["timing"];
        let transcript = jsonData["transcript"];
        transcript = transcript.replaceAll("\n", "<br/>");
        let html = "";
        transcript.split("▴").forEach(function (elem, idx) {
            html += "<span id='span" + idx + "'>" + elem + "</span>";
        });
        G.displayField.innerHTML = html;
    });
 });

function loadJSON(callback) {   
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './sampleWithIPA.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
 }