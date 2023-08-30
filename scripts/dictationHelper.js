// Globals
class GlobalManager {
    constructor() {
        this.waveformBase = document.getElementById("waveformBase");
        this.filename = document.getElementById("filename");
        this.playButton = document.getElementById("playButton");
        this.playButton2 = document.getElementById("playButton2");
        this.stampButton = document.getElementById("stampButton");
        this.pointMover = document.getElementById("pointMover");
        this.zoomInButton = document.getElementById("zoomInButton");
        this.zoomOutButton = document.getElementById("zoomOutButton");
        this.timerField = document.getElementById("timerField");
        this.controls = document.getElementById("controls");
        this.textArea = document.getElementById("textArea");
        this.speedRange = document.getElementById("speedRange");
        this.playSpeed = document.getElementById("playSpeed");
        this.fileOutput = document.getElementById("fileOutput");
        this.currentZoomFactor = 10;
        this.minimumZoomFactor = 10;
        this.zoomDelta = 5;
        this.startPoint = 0.0;
        this.nextCandidatePoint = 0.0;
    }
}

const G = new GlobalManager();
updateOperationButton();

/*
 * Events setup
*/
window.addEventListener("resize", (evt) => {
    resize();
});
window.addEventListener("load", (evt) => {
    resize();
});
function resize() {
    G.textArea.style = "height: " + (window.innerHeight - G.controls.getBoundingClientRect().height - 70) + "px;";
}


// Button controls
//    Press control
G.playButton.addEventListener("mousedown", function(evt) {
    playButton2.disabled = true;
    playStart();
});

G.playButton.addEventListener("mouseup", function(evt) {
    playButton2.disabled = false;
    playStop();
    G.textArea.focus();
});

G.playButton.addEventListener("touchstart", function(evt) {
console.log("T start");
    playButton2.disabled = true;
    playStart();
});

G.playButton.addEventListener("touchend", function(evt) {
    playButton2.disabled = false;
    playStop();
    G.textArea.focus();
});

//    Push control
G.playButton2.addEventListener("click", function(evt) {
    if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
    } else {
        playButton.disabled = true;
        wavesurfer.play();
    }
});

// Anchor & record
G.stampButton.addEventListener("click", function(evt) {
    stampIt(evt);
});

// Anchor button
G.pointMover.addEventListener("click", function(evt) {
    setCTTM();
});


// Shortcut keys
window.addEventListener('keydown', function(evt) {
    if (evt.key == "Alt") {
        if (evt.code == "AltLeft") {
            if (evt.shiftKey) {
                stampIt(evt);
            } else {
                playStart();
            }
        } else {    // AltRight
            if (evt.shiftKey) {
                setCTTM();
            } else {
                if (wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                } else {
                    wavesurfer.play();
                }
            }
        }
        evt.preventDefault();
    } else if ((evt.key >= "1") && (evt.key <= "9") && evt.ctrlKey) {
        wavesurfer.skipBackward(evt.key);
        evt.preventDefault();
    }
});

window.addEventListener('keyup', function(evt) {
    if (evt.code == "AltLeft") {
        playStop();
    }
});

G.waveformBase.addEventListener("click", function() {
    setTimeout(() => {
        G.nextCandidatePoint = wavesurfer.getCurrentTime();
        updateButtonLabel();
        updateOperationButton();
    }, 100);
});


/*
 * Wavesurfer setup
 */
let wavesurfer = WaveSurfer.create({
    container: '#waveform' ,
    waveColor: '#6495ed',
    progressColor: '#b03a2e',
    backend: 'MediaElement'     // it is to change speed without affecting the pitch
});

wavesurfer.on("play", function() {
    setTimeout(timer, 10);
    G.playButton.value = "Release to Stop";
    G.playButton2.value = "Click to Stop";
});

wavesurfer.on("pause", function() {
    playButton.disabled = false;
    updateButtonLabel();
    updateOperationButton();
});

wavesurfer.on("finish", function() {
    playButton.disabled = false;
    updateButtonLabel();
    wavesurfer.seekTo(0);
    updateOperationButton();
});

//wavesurfer.setHeight(50);



function updateButtonLabel() {
    G.playButton.value = "Press Play from " + getTime(G.startPoint) + " ";
    G.playButton2.value = "Toggle Play from " + getTime(wavesurfer.getCurrentTime()) + " ";
}

function updateOperationButton() {
    G.stampButton.value = "Set head & log @" + getTime(G.nextCandidatePoint) + " ";
    G.pointMover.value = "Set head @" + getTime(G.nextCandidatePoint) + " ";
}


function timer() {
    let rawTime = wavesurfer.getCurrentTime();
    G.timerField.value = getTime(rawTime);
    if (G.playButton.disabled) {    // means Push/Pause button is activated
        G.playButton.value = getTime(G.nextCandidatePoint) + " ";
    } else {
        G.playButton2.value = getTime(G.nextCandidatePoint) + " ";
    }
    G.nextCandidatePoint = rawTime;
    if (wavesurfer.isPlaying()) {
        setTimeout(timer, 10);
    } else {
        updateButtonLabel();
    }
};



function rewind(sec) {
    wavesurfer.skipBackward(sec);
    G.nextCandidatePoint -= sec;
    if (G.nextCandidatePoint < 0) {
        G.nextCandidatePoint = 0.0;
    }
    updateButtonLabel();
    updateOperationButton();
}

function playStart() {
    wavesurfer.play(G.startPoint);
}

function playStop() {
    wavesurfer.pause();
    G.nextCandidatePoint = wavesurfer.getCurrentTime();
}

function stampIt(evt) {
    G.startPoint = G.nextCandidatePoint;
    updateButtonLabel();
    let saveIt = textArea.selectionStart;
    let stampVal = "[[" + getTime(G.startPoint) + "]]";
    G.textArea.value = G.textArea.value.substring(0, saveIt) + stampVal + 
            G.textArea.value.substring(G.textArea.selectionEnd);
    saveIt += stampVal.length;
    G.textArea.setSelectionRange(saveIt, saveIt);
    G.textArea.focus();   // to make chrome happy.
}

function getTime(currentTime) {
    let ct = Math.floor(currentTime * 100);
    let hour = Math.floor(ct / 360000);
    let minute = Math.floor(ct % 360000 / 6000);
    let sec = Math.floor(ct % 6000 / 100);
    let csec = Math.floor(ct % 100);
    if (hour == 0) {
        if (minute == 0) {
            return sec + "." + ("00" + csec).slice(-2);
        }
        return minute + ":" + ("00" + sec).slice(-2) + "." + ("00" + csec).slice(-2);
    }
    return hour + ":" + ("00" + minute).slice(-2) + ":" + ("00" + sec).slice(-2) + "." + ("00" + csec).slice(-2);
}

function stringTimeToSec(str) {
    let parts = str.split(/:/);
    let factor = 1;
    let val = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
        val += factor * parts[i];
        factor *= 60;
    }
    return val;
}

function clicker() {
    let dat = G.textArea.value;
    let pt = G.textArea.selectionStart;

    let leftValue = dat.substring(0, pt);
    let rightValue = dat.substring(pt);
    let a = leftValue.lastIndexOf("[[");
    let b = leftValue.lastIndexOf("]]");
    if ((a == -1) || (b > a)) {
        return;
    }
    let c = rightValue.indexOf("]]");
    let timeValue = leftValue.substring(a+2) + rightValue.substring(0, c);
    G.textArea.selectionStart = pt + c + 2;
    G.startPoint = stringTimeToSec(timeValue);
    wavesurfer.play(G.startPoint, G.startPoint+0.004);
}

// Called when zoom-in button is pushed.
function zoomIn() {
    G.zoomOutButton.disabled = false;
    G.currentZoomFactor += G.zoomDelta;
    wavesurfer.zoom(G.currentZoomFactor);
}

// Called when zoom-out button is pushed.
function zoomOut() {
    if (G.currentZoomFactor > G.minimumZoomFactor) {
        G.currentZoomFactor -= G.zoomDelta;
        wavesurfer.zoom(G.currentZoomFactor);
        if (G.currentZoomFactor == G.minimumZoomFactor) {
            G.zoomOutButton.disabled = true;
        }
    }
}

// Called when speed-slider is changed.
function speedChange(obj) {
    wavesurfer.setPlaybackRate(obj.value);
}

function setCTTM() {
    G.startPoint = G.nextCandidatePoint;
    updateButtonLabel();
}

/*
 * File I/Os
 */
// File reader
window.addEventListener('DOMContentLoaded', function() {
    let obj1 = document.getElementById("mediaFile");
    obj1.addEventListener("change",function(evt){
        let file = evt.target.files[0];
        G.filename.innerHTML = file.name;
        switch (file.name.split(".").pop()) {
        case "txt" :
            let reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function () {
                G.textArea.value = reader.result;
            }
            break;
        default:
            wavesurfer.load(window.URL.createObjectURL(file));
            G.startPoint = 0.0;
            updateButtonLabel();
            G.playButton.disabled = false;
            G.playButton2.disabled = false;
        }
    },false);
});

// File Writer
function outputFile() {
    let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([ bom,  G.textArea.value ], { "type" : "text/plain" });
    if (window.navigator.msSaveBlob) { 
        window.navigator.msSaveBlob(blob, "timeStamped.json"); 
        window.navigator.msSaveOrOpenBlob(blob, "timeStamped.json"); 
    } else {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = "script.txt";
        a.click();
    }
}
