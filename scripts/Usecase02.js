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
});

wavesurfer.on("finish", function() {
    G.playButton.value = "再生";
    G.speedSelector.disabled = false;
});

// Called when Play/Pause button is pushed.
function playPause() {
    if (!wavesurfer.isPlaying()) {
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
//questionSelected(0);

function questionSelected(val) {
    if (G.qSelector.selectedIndex <= 0) {
        G.timingList = [];
        G.displayField.innerHTML = "";
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
        G.displayField.innerHTML = createHTML(shiftDelimiters(jsonData["transcript"]));
    };
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
    wavesurfer.play(G.timingList[idx], G.timingList[idx+1]);
}

function markThisPoint() {
    let ctime = wavesurfer.getCurrentTime();
    G.markList.push(ctime);
    let i = 0;
    while (ctime > Number(G.timingList[i])) {
        i++;
    }
    if (i > 1) {
        document.getElementById("span" + (i - 1)).style = "color: MediumVioletRed;";
        if (i > 2) {
            document.getElementById("span" + (i-2)).style = "color: HotPink;";
        }
    }
}

function toggleHideShow() {
    if (G.hidden) {
        G.displayField.hidden = false;
        G.hidden = false;
        G.hideShowButton.value = "Hide";
    } else {
        G.displayField.hidden = true;
        G.hidden = true;
        G.hideShowButton.value = "Show";
    }
}
