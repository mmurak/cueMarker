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
    G.playButton.value = G.pauseLabel;
});

wavesurfer.on("pause", function() {
    G.playButton.value = G.playLabel;
    G.playButton.disabled = false;
    wavesurfer.un("audioprocess", verifying);
    G.verifyButton.value = G.verifyPlayLabel;
    G.verifyButton.disabled = false;
});

wavesurfer.on("finish", function() {
    G.playButton.value = G.playLabel;
    G.playButton.disabled = false;
    wavesurfer.un("audioprocess", verifying);
    G.verifyButton.disabled = false;
});

// Stopwatch control
let timer = function() {
    G.timerField.value = (Math.floor(wavesurfer.getCurrentTime() * 100.0) / 100.0).toFixed(2);
    if (!wavesurfer.isPlaying()) {
        G.playButton.value = G.playLabel;
    }
};
setInterval(timer, 10);

// Called when Play/Pause button is pushed.
function playPause() {
    if (!wavesurfer.isPlaying()) {
        G.verifyButton.disabled = true;
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

// Called when speed-controll selector is changed.
function speedControl() {
    G.playSpeed.innerHTML = G.speedRange.value;
    wavesurfer.setPlaybackRate(Number(G.speedRange.value) / 100.0);
}

// File reader
window.addEventListener('DOMContentLoaded', function() {
    G.playButton.value = G.playLabel;
    G.inputFileButton.addEventListener("change",function(evt){
        let file = evt.target.files[0];
        switch (file.name.split('.').pop()) {
            case 'mp3' :
            case 'mp4' :
                G.soundFileName = file.name;
                wavesurfer.load(window.URL.createObjectURL(file));
                break;
            case 'txt' :
                G.transcriptFileName = file;
                let reader = new FileReader();
                reader.readAsText(file);
                reader.onload = function () {
                    G.transcriptField.innerHTML = explode(reader.result);
                }
                break;
            case 'js' :
                let dscr = document.getElementById("DynamicScript");
                if (dscr != null) {
                    dscr.parentNode.removeChild(dscr);
                }
                let script = document.createElement("script");
                script.type = "text/javascript";
                script.src = "./data/" + file.name;
                script.id = "DynamicScript";
                document.body.appendChild(script);
                script.onload = function () {
                    if (("version" in jsonData) && (Number(G.versionNo) >= Number(jsonData["version"]))) {
                        G.transcriptField.innerHTML = jsonData["transcript"];
                        G.timingList = jsonData["timing"];
                        G.spanLength = G.timingList.length - 1;
                        wavesurfer.load("./data/" + jsonData["sound"]);
                        G.soundFileName = jsonData["sound"];
                    } else {
                        alert("Compatibility error [" + G.versionNo + "]: \"" + file.name + "\" (" + jsonData["version"] + ")");
                    }
                };
                break;
            default:
                alert("This file type is not supported: " + file.name);
        }
    },);
    document.addEventListener("selectionchange", (evt) => {
        if (!wavesurfer.isPlaying()) return;
        let {anchorNode, focusNode} = document.getSelection();
        if ((anchorNode == null) && (focusNode == null)) return;
        let focnode = Number(focusNode.parentNode.id.substr(2));
        let ct = wavesurfer.getCurrentTime();
        G.timingList[focnode] = ct;
        let ancnode = Number(anchorNode.parentNode.id.substr(2));
        for (let i = ancnode; i <= focnode; i++) {
            let sp = document.getElementById("sp" + i);
            if (sp != null) sp.style = "color: red;";
            if (G.timingList[i] == null) {
                G.timingList[i] = ct;
            }
        }
    });
    document.addEventListener("keydown", (evt) => {
        switch (evt.code) {
            case "Space":
                playPause();
                evt.preventDefault();
                break;
            case "KeyA":
                rewind1second();
                break;
            case "KeyG":
                changeColour();
                break;
            default:
                console.log(evt.code);
        }
    });
});

function explode(str) {
    let strArray = str.split("").filter((val) => {
        return val !== "\r";
    });
    let retVal = "";
    let spanNo = 1;
    strArray.forEach((elem) => {
        switch (elem) {
            case "\n":
                retVal += "<br/>";
                break;
            case "<":
                retVal += "&lt;";
                break;
            case ">":
                retVal += "&gt;";
                break;
            case "&":
                retVal += "&amp;";
                break;
            default:
                retVal += "<span id='sp" + spanNo + "'>" + elem + "</span>";
                spanNo++;
        }
    });
    G.spanLength = spanNo;
    G.timingList = new Array(spanNo);
    G.timingList.push(999999.99);
    return retVal;
}

function changeColour() {
    for (let i = 1; i < G.spanLength; i++) {
        if (G.timingList[i] != null) {
            document.getElementById("sp" + i).style = "color: blue;";
        }
    }
}

function resetColour() {
    for(let i = 1; i < G.spanLength; i++) {
        document.getElementById("sp" + i).style = "";
    }
}

function verifying() {
    let cTime = wavesurfer.getCurrentTime();
    for (let i = 0; i < G.timingList.length; i++) {
        if (G.timingList[i] == null) continue;
        if (G.timingList[i] < cTime) {
            document.getElementById("sp" + i).style = "color: #228b22;";
        }
    }
}

function veriPlay() {
    if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
    } else {
        if (G.spanLength == 0) return;
        resetColour();
        G.processPointer = 1;
        wavesurfer.on("audioprocess", verifying);
        G.verifyButton.value = G.verifyPauseLabel;
        G.playButton.disabled = true;
        wavesurfer.play(0);
    }
}

function createJSONstring() {
    let jsonData = {};
    jsonData["version"] = G.versionNo;
    jsonData["sound"] = G.soundFileName;
    resetColour();
    jsonData["transcript"] = G.transcriptField.innerHTML;
    jsonData["timing"] = G.timingList;
    return JSON.stringify(jsonData);
}

function outputJSONJSFile() {
    let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([ bom,  "jsonData = " + createJSONstring() + ";"], { "type" : "text/plain" });
    if (window.navigator.msSaveBlob) { 
        window.navigator.msSaveBlob(blob, "cueMarked.js"); 
        window.navigator.msSaveOrOpenBlob(blob, "cueMarked.js"); 
    } else {
        G.jsFileOutput.href = window.URL.createObjectURL(blob);
    }
}
