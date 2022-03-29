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
    setTranscript();
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
        setTranscript();
    };
}

function setTranscript() {
    let str = jsonData["transcript"];
    if (G.regulariseSelection.checked) {
        G.displayField.innerHTML = createHTML(shiftDelimiters(str));
    } else {
        G.displayField.innerHTML = createHTML(str);
    }
    paintColour();
}

function createHTML(transcript) {
    let segArray = (" " + transcript).split(/▴/);
    let content = "";
    segArray.forEach((elem, idx) => {
        content += "<a href=\"#\" onclick=\"pplay(" + idx + ");\"><span id=\"span" + idx + "\">" + elem + "</span></a>";
    });
    return content.replaceAll("\n", "<br/>");
}

function shiftDelimiters(inData) {
    let charArray = inData.split("");
    charArray.unshift(" ");   // sentinel
    let spptr = 0;
    let ptr = 0;
    while (ptr < charArray.length) {
        switch (charArray[ptr]) {
            case " " :
            case "\n" :
                spptr = ptr;
                break;
            case "▴" :
                charArray.splice(ptr, 1);
                charArray.splice(spptr+1, 0, "▴");
                break;
            default :
        }
        ptr++;
    }
    charArray.shift();  // remove sentinel
    return charArray.join("");
}

function pplay(idx) {
    wavesurfer.play(G.timingList[idx]);
//    wavesurfer.play(G.timingList[idx], G.timingList[idx+1]);
}

function paintColour() {
    // reset
    for (let i = 0; i < G.timingList.length-1; i++) {
        document.getElementById("span" + i).style = "text-decoration: none;";
    }
    // real logic structure
    let delayTime = 5.00 - G.delayControl.value;
    G.dTime.innerHTML = delayTime.toFixed(2);
    for(let i = 0; i < G.underlineList.length; i++) {
        let startTime = G.underlineList[i][0] - delayTime;
        let endTime  = G.underlineList[i][1] - delayTime;
        let beginP = 0;
        while(startTime >= G.timingList[beginP]) {
            beginP++;
        }
        beginP--;
        let endP = beginP;
        while(endTime > G.timingList[endP]) {
            endP++;
        }
        if (!G.regulariseSelection.checked) {
            endP--;
        }
        for (let j = beginP; j <= endP; j++) {
            document.getElementById("span" + j).style = "text-decoration: underline;text-decoration-color: red";
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
