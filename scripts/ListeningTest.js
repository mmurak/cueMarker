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
    G.playButton.value = "停止";
    G.speedSelector.disabled = true;
});

wavesurfer.on("pause", function() {
    G.playButton.value = "再生";
    G.speedSelector.disabled = false;
    registerUnderlineList();
});

wavesurfer.on("finish", function() {
    G.playButton.value = "再生";
    G.speedSelector.disabled = false;
    registerUnderlineList();
});

// Called when Play/Pause button is pushed.
function playPause() {
    if (!wavesurfer.isPlaying()) {
        if (wavesurfer.getCurrentTime == 0) {
            G.underlineList = [];
        }
        wavesurfer.play();
    } else {
        wavesurfer.pause();
    }
}

// Called when speed-controll selector is changed.
function speedController(speed) {
    wavesurfer.setPlaybackRate(Number(speed));
}


let opt = document.createElement("option");
opt.text = "--";
opt.value = null;
G.qSelector.appendChild(opt);
directory.forEach(elem => {
    let opt = document.createElement("option");
    opt.text = elem[0];
    opt.value = elem[1];
    G.qSelector.appendChild(opt);
});
G.qSelector.index = 0;

G.markButton.addEventListener("mousedown", function() {
    if (wavesurfer.isPlaying()) {
        G.timeStart = wavesurfer.getCurrentTime();
    }
});

G.markButton.addEventListener("mouseup", function() {
    registerUnderlineList();
});

G.regulariseSelection.addEventListener("change", function() {
    paintColour();
});

function registerUnderlineList() {
    if (G.timeStart != -1) {
        G.underlineList.push([G.timeStart, wavesurfer.getCurrentTime()]);
        G.timeStart = -1;
        paintColour();
    }
}

function questionSelected(val) {
    if (G.qSelector.selectedIndex <= 0) {
        G.timingList = [];
        G.displayField.innerHTML = "";
        G.underlineList = [];
        return;
    }
    let filename = val.value;
    let dscr = document.getElementById("DynamicScript");
    if (dscr != null) {
        dscr.parentNode.removeChild(dscr);
    }
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "./data/" + filename;
    script.id = "DynamicScript";
    document.body.appendChild(script);
    script.onload = function () {
        wavesurfer.load("./data/" + jsonData["sound"]);
        G.timingList = jsonData["timing"];
        G.underlineList = [];
        analyseTranscript(jsonData["transcript"]);
        G.displayField.innerHTML = jsonData["transcript"]
    };
}

function analyseTranscript(str) {
    const regex = /(<span id="sp(\d+)"[^>]*>([^<]*)<\/span>|<br\/>)/g;
    const alpha = /[a-zA-Z]/;
    let result;
    let prevW = false;
    let startInfo = [];
    while((result = regex.exec(str)) !== null) {
//        console.log(result[3]);
        let currentW;
        if (result[0] == "<br/>") {
            currentW = false;
        } else if (result[3].match(alpha)) {
            currentW = true;
        } else {
            currentW = false;
        }
        if ((prevW == false) && (currentW == true)) {
            let spanNo = Number(result[2]);
            startInfo = [spanNo, G.timingList[spanNo]];
        } else if ((prevW == true) && (currentW == false)) {
            let spanNo = Number(result[2]) - 1;
            G.wordCueList.push([startInfo, [spanNo, G.timingList[spanNo]]]);
        }
        prevW = currentW;
    }
    if (prevW == true) {
        let lastIdx = G.timingList.length - 1;
        G.wordCueList.push([startInfo, [lastIdx, G.timingList[lastIdx]]]);
    }
}

function paintColour() {
    // reset
    for (let i = 1; i < G.timingList.length-1; i++) {
        document.getElementById("sp" + i).style = "text-decoration: none;";
    }
    // real logic structure
    let delayTime = 5.00 - G.delayControl.value;
    G.dTime.innerHTML = delayTime.toFixed(2);

    if (G.regulariseSelection.checked) {
        for(let i = 0; i < G.underlineList.length; i++) {
            let startTime = G.underlineList[i][0] - delayTime;
            let endTime  = G.underlineList[i][1] - delayTime;
            G.wordCueList.forEach(function(elem, index) {
                let wordStart = elem[0];
                let wordEnd = elem[1];
                if ((wordStart[1] == null) || (wordEnd[1] == null)) return;
                if ((startTime <= wordEnd[1]) && (wordStart[1] <= endTime)) {
                    for (let j = wordStart[0]; j <= wordEnd[0]; j++) {
                        let elemR = document.getElementById("sp" + j);
                        if (elemR != null) {
                            elemR.style = "text-decoration: underline;text-decoration-color: red";
                        }
                    }
                }
            });
        }
    } else {
        for(let i = 0; i < G.underlineList.length; i++) {
            let startTime = G.underlineList[i][0] - delayTime;
            let endTime  = G.underlineList[i][1] - delayTime;
            for (let j = 1; j <= G.timingList.length-1; j++) {
                let t = G.timingList[j];
                if ((t != null) && (t >= startTime) && (t <= endTime)) {
                    document.getElementById("sp" + j).style = "text-decoration: underline;text-decoration-color: red";
                }
            }
        }
    }
}

function toggleHideShow() {
    if (G.hidden) {
        G.displayField.hidden = false;
        G.hidden = false;
        G.hideShowButton.value = "隠す";
//        paintColour();
    } else {
        G.displayField.hidden = true;
        G.hidden = true;
        G.hideShowButton.value = "表示";
    }
}
