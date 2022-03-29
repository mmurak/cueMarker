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

// Called when Play/Pause button is pushed.
function playPause() {
    if (!wavesurfer.isPlaying()) {
        wavesurfer.play();
    } else {
        wavesurfer.pause();
    }
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
function speedController(speed) {
  wavesurfer.setPlaybackRate(Number(speed));
}

// File reader
window.addEventListener('DOMContentLoaded', function() {
    G.inputFileButton.addEventListener("change",function(evt){
        let file = evt.target.files[0];
        switch (file.name.split('.').pop()) {
            case 'mp3' :
            case 'mp4' :
                G.soundFileName = file.name;
                wavesurfer.load(window.URL.createObjectURL(file));
                wavesurfer.on("ready", function () {
                    loadTimeArray(G.intervalTime);
                });
                break;
            case 'txt' :
                G.transcriptFileName = file;
                let reader = new FileReader();
                reader.readAsText(file);
                reader.onload = function () {
                    G.transcriptField.value = reader.result;
                    G.timingList = [-1, 99999.0];
                    clearSelector();
                    G.timeMarkSelector.selectedIndex = -1;
                    G.timeMarkSelector.focus();
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
                    G.transcriptField.value = jsonData["transcript"];
                    G.timingList = jsonData["timing"];
                    wavesurfer.load("./data/" + jsonData["sound"]);
                    G.soundFileName = jsonData["sound"];
                    wavesurfer.on("ready", function () {
                        loadTimeArray(G.intervalTime);
                        for (let i = 0; i < G.timeMarkSelector.length; i++) {
                            let val = Number(G.timeMarkSelector[i].value);
                            if (G.timingList.includes(val)) {
                                G.timeMarkSelector[i].innerHTML = "▶" + val.toFixed(2);
                            }
                        }
                    });
                };
                break;
            default:
                alert("This file type is not supported: " + file.name);
        }
    },);
    G.timeMarkSelector.addEventListener("change", function(evt) {
        changeColour();
    });
    G.timeMarkSelector.addEventListener("keyup", function(evt) {
        if (wavesurfer.isPlaying()) {
            wavesurfer.pause();
        }
    });
    G.timeMarkSelector.addEventListener("keydown", function(evt) {
        if (evt.repeat) {
            evt.preventDefault();
            return;
        }
        let sidx = G.timeMarkSelector.selectedIndex;
        if (sidx == -1) return;
        switch (evt.code) {
            case "Space" :
                wavesurfer.play(Number(G.timeMarkSelector[sidx].value));
                evt.preventDefault();
                break;
            case "Delete" :
            case "Backspace" :
                let st = getSelectedTime();
                let idx = searchRegisteredTime(st);
                if (idx != -1) {
                    G.transcriptField.value = G.transcriptField.value.replaceAll("🔺", "");
                    G.timingList.splice(idx, 1);
                    let selval = Number(G.timeMarkSelector[G.timeMarkSelector.selectedIndex].value);
                    G.timeMarkSelector[G.timeMarkSelector.selectedIndex].innerHTML = selval.toFixed(2);
                }
                break;
            default :
                console.log(evt.code);
        }
    });
});

function clearSelector() {
    while (G.timeMarkSelector.firstChild) {
        G.timeMarkSelector.removeChild(G.timeMarkSelector.firstChild);
    }
}

function loadTimeArray(interval) {
    clearSelector();
    let duration = wavesurfer.getDuration();
    for (let s = 0; s < duration; s += interval) {
        let option = document.createElement("option");
        option.innerHTML = s.toFixed(2);
        option.style = "text-align: right";
        option.value = s;
        G.timeMarkSelector.appendChild(option);
    }
}

function changeColour() {
    let tlIdx = 0;
    for (let i = G.timeMarkSelector.selectedIndex; i > -1; i--) {
        if (G.timeMarkSelector[i].innerHTML.indexOf("▶") != -1) {
            tlIdx++;
        }
    }
    if (tlIdx == 0) return;
    let content = G.transcriptField.value.replaceAll("🔺", "▴");
    let carray = content.split("▴");
    G.transcriptField.value = carray.slice(0, tlIdx).join("▴") + "🔺" + carray.slice(tlIdx).join("▴");
}

function getSubstringIndex(str, substring, nth) {
    return str.split(substring, nth).join(substring).length;
}

function eraseNthCue(n) {
    let content = G.transcriptField.value;
//    let i = getSubstringIndex(G.transcriptField.value, "▴", n);
//    G.transcriptField.value = content.substr(0, i) + content.substr(i + 1);
    G.transcriptField.value = content.replaceAll("🔺", "");
}

function updateTimeMarkSelector() {
    let selectedIdx = G.timeMarkSelector.selectedIndex;
    while (G.timeMarkSelector.firstChild) {
        G.timeMarkSelector.removeChild(G.timeMarkSelector.firstChild);
    }
    for (let i = 1; i < G.timingList.length - 1; i++) {
        let elem = document.createElement("option");
        elem.value = i;
        elem.innerHTML = G.timingList[i].toFixed(2) + " sec.";
        elem.style = "text-align: right";
        G.timeMarkSelector.appendChild(elem);
    }
    G.timeMarkSelector.selectedIndex = selectedIdx;
}

function searchRegisteredTime(ts) {
    for (let i = 1; i < G.timingList.length - 1; i++) {
        if (G.timingList[i] == ts) return i;
    }
    return -1;
}

function getSelectedTime() {
    let idx = G.timeMarkSelector.selectedIndex;
    return Number(G.timeMarkSelector[idx].value);
}

function clicked() {
    if (G.timeMarkSelector.selectedIndex == -1) {
        G.timeMarkSelector.focus();
        return;
    }
    let timeStamp = getSelectedTime();
    if (searchRegisteredTime(timeStamp) != -1) {
        return;
    }
    let content = G.transcriptField.value.replaceAll("🔺", "▴");;
    let length = content.length;
    let pos = G.transcriptField.selectionStart;
    if ((content.substr(pos-1, 1) == "▴")||(content.substr(pos, 1) == "▴")||(content.substr(pos+1, 1) == "▴")) {
        return;  // abort
    }
    let beforeStr = content.substr(0, pos);
    let marksCount = (beforeStr.match(/[▴]/g) || []).length;
    // check  n番目がより小さく、かつ、n+1番目がより大きい
    if ((G.timingList[marksCount] < timeStamp) && (timeStamp < G.timingList[marksCount+1])) {
        let afterStr = content.substr(pos, length);
        G.transcriptField.value = beforeStr + "🔺" + afterStr;
        G.timingList.splice(marksCount+1, 0, timeStamp);
        G.timeMarkSelector[G.timeMarkSelector.selectedIndex].innerHTML = "▶" + timeStamp.toFixed(2);
    } else {
        let segStart = (G.timingList[marksCount] == -1.0) ? "start-of-sound-source" : G.timingList[marksCount].toFixed(2);
        let segEnd = (G.timingList[marksCount+1] == 99999.0) ? "end-of-sound-source" : G.timingList[marksCount+1].toFixed(2);
        alert("The timing at this point must be between " + segStart + " and " + segEnd + ".");
    }
    G.timeMarkSelector.focus();
}

function createJSONstring() {
    let jsonData = {};
    jsonData["sound"] = G.soundFileName;
    jsonData["transcript"] = G.transcriptField.value.replaceAll("🔺", "▴");
    jsonData["timing"] = G.timingList;
    return JSON.stringify(jsonData);
}

function outputJSONJSFile() {
    let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([ bom,  "jsonData = " + createJSONstring() + ";"], { "type" : "text/plain" });
    if (window.navigator.msSaveBlob) { 
        window.navigator.msSaveBlob(blob, "timeStamped.json.js"); 
        window.navigator.msSaveOrOpenBlob(blob, "timeStamped.json.js"); 
    } else {
        G.jsonJsFileOutput.href = window.URL.createObjectURL(blob);
    }
}
