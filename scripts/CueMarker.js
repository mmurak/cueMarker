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
    G.previousPlayButton.value = "Pause";
    G.speedSelector.disabled = true;
});

wavesurfer.on("pause", function() {
    G.playButton.value = "Play";
    G.previousPlayButton.value = "Play";
    G.speedSelector.disabled = false;
});

wavesurfer.on("finish", function() {
    G.playButton.value = "Play";
    G.previousPlayButton.value = "Play";
    G.speedSelector.disabled = false;
});

// Stopwatch control
let timer = function() {
    G.timerField.value = (Math.floor(wavesurfer.getCurrentTime() * 100.0) / 100.0).toFixed(2);
    if (!wavesurfer.isPlaying()) {
        G.playButton.value = "Play";
        G.previousPlayButton.value = "Play";
    }
};
setInterval(timer, 10);

// Called when Play/Pause button is pushed.
function playPause() {
    if (!wavesurfer.isPlaying()) {
        G.previousTimerField.value = G.timerField.value;
        wavesurfer.play();
    } else {
        wavesurfer.pause();
    }
}

function previousPlayPause() {
    if (!wavesurfer.isPlaying()) {
        wavesurfer.play(G.previousTimerField.value);
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
                break;
            case 'txt' :
                G.transcriptFileName = file;
                let reader = new FileReader();
                reader.readAsText(file);
                reader.onload = function () {
                    G.transcriptField.value = reader.result;
                    G.timingList = [-1, 99999.0];
                    updateTimeMarkSelector();
                    G.timeMarkSelector.selectedIndex = -1;
                    G.timeMarkSelector.focus();
                }
                break;
            case 'json' :
                let readerJSON = new FileReader();
                readerJSON.readAsText(file);
                readerJSON.onload = function () {
                    let jsonData = JSON.parse(readerJSON.result);
                    G.transcriptField.value = jsonData["transcript"];
                    G.timingList = jsonData["timing"];
                    wavesurfer.load("./data/" + jsonData["sound"]);
                    G.soundFileName = jsonData["sound"];
                    updateTimeMarkSelector();
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
                    updateTimeMarkSelector();
                    G.timeMarkSelector.selectedIndex = -1;
                    G.timeMarkSelector.focus();
                };
                break;
            default:
                alert("This file type is not supported: " + file.name);
        }
    },);
    G.timeMarkSelector.addEventListener("change", function(evt) {
        changeColour();
    });
    G.timeMarkSelector.addEventListener("keydown", function(evt) {
        let idx = G.timeMarkSelector.selectedIndex;
        if (idx == -1) return;
        switch (evt.code) {
            case "Backspace" :
            case "Delete" :
                G.timingList.splice(idx+1, 1);
                updateTimeMarkSelector();
                G.timeMarkSelector.selectedIndex = -1;
                G.timeMarkSelector.focus();
                eraseNthCue(idx+1);
                changeColour();
                evt.preventDefault();
                break;
            case "Space" :
                wavesurfer.play(G.timingList[idx+1], G.timingList[idx+2]);
                evt.preventDefault();
                break;
            case "ArrowLeft" :
                tuningCue(idx + 1, (evt.shiftKey) ? -0.1 : -0.01);
                evt.preventDefault();
                break;
            case "ArrowRight" :
                tuningCue(idx + 1, (evt.shiftKey) ? 0.1 : 0.01);
                evt.preventDefault();
                break;
            case "ArrowUp" :
                G.timeMarkSelector.selectedIndex--;
                changeColour();
                evt.preventDefault();
                break;
            case "ArrowDown" :
                G.timeMarkSelector.selectedIndex++;
                changeColour();
                evt.preventDefault();
                break;
            case "Digit1" :
                fixedTimeControl(1, evt.shiftKey);
                evt.preventDefault();
                break;
            case "Digit2" :
                fixedTimeControl(2, evt.shiftKey);
                evt.preventDefault();
                break;
            case "Digit3" :
                fixedTimeControl(3, evt.shiftKey);
                evt.preventDefault();
                break;
            default :
//                console.log(evt.code);
        }
    });
});

function fixedTimeControl(sec, isShift) {
    let delta = (isShift) ? -sec : sec;
    let gValue = Number(G.previousTimerField.value) + delta;
    gValue = (gValue < 0) ? 0 : gValue;
    G.previousTimerField.value = gValue.toFixed(2);
}

function changeColour() {
    let idx = G.timeMarkSelector.selectedIndex;
    let content = G.transcriptField.value.replaceAll("🔺", "▴");
    if (idx < 0) {
        G.transcriptField.value = content;
        return;
    }
    let point = getSubstringIndex(content, "▴", idx + 1);
    G.transcriptField.value = content.substr(0, point) + "🔺" + content.substr(point + 1);
}

function tuningCue(idx, val) {
    let newVal = G.timingList[idx] + val;
    if (val < 0.0) {
        newVal = (G.timingList[idx - 1] >= newVal) ? G.timingList[idx - 1] + 0.01 : newVal;
    } else {
        newVal = (G.timingList[idx + 1] <= newVal) ? G.timingList[idx + 1] - 0.01 : newVal;
    }
    G.timingList[idx] = newVal;
    updateTimeMarkSelector();
    G.timeMarkSelector.focus();
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

function clicked() {
    G.timeMarkSelector.selectedIndex = -1;
    let content = G.transcriptField.value.replaceAll("🔺", "▴");;
    let length = content.length;
    let pos = G.transcriptField.selectionStart;
    let beforeStr = content.substr(0, pos);
    let marksCount = (beforeStr.match(/[▴]/g) || []).length;
    let timeStamp = Number(G.previousTimerField.value);
    // check  n番目がより小さく、かつ、n+1番目がより大きい
    if ((G.timingList[marksCount] < timeStamp) && (timeStamp < G.timingList[marksCount+1])) {
        let afterStr = content.substr(pos, length);
        G.transcriptField.value = beforeStr + "🔺" + afterStr;
        G.timingList.splice(marksCount+1, 0, timeStamp);
        updateTimeMarkSelector();
        G.timeMarkSelector.selectedIndex = marksCount;
        G.timeMarkSelector.focus();
    } else {
        let segStart = (G.timingList[marksCount] == -1.0) ? "start-of-sound-source" : G.timingList[marksCount].toFixed(2);
        let segEnd = (G.timingList[marksCount+1] == 99999.0) ? "end-of-sound-source" : G.timingList[marksCount+1].toFixed(2);
        alert("The timing at this point must be between " + segStart + " and " + segEnd + ".");
    }
}

function createJSONstring() {
    let jsonData = {};
    jsonData["sound"] = G.soundFileName;
    jsonData["transcript"] = G.transcriptField.value.replaceAll("🔺", "▴");
    jsonData["timing"] = G.timingList;
    return JSON.stringify(jsonData);
}

function outputFile() {
    let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([ bom,  createJSONstring() ], { "type" : "text/plain" });
    if (window.navigator.msSaveBlob) { 
        window.navigator.msSaveBlob(blob, "timeStamped.json"); 
        window.navigator.msSaveOrOpenBlob(blob, "timeStamped.json"); 
    } else {
        G.fileOutput.href = window.URL.createObjectURL(blob);
    }
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
