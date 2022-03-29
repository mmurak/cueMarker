class GlobalManager {
    constructor() {
        this.inputFileButton = document.getElementById("InputFileButton");
        this.playButton = document.getElementById("PlayButton");
        this.zoomInButton = document.getElementById("ZoomInButton");
        this.zoomOutButton = document.getElementById("ZoomOutButton");
        this.speedSelector = document.getElementById("SpeedSelector");
        this.jsonJsFileOutput = document.getElementById("JSONJSFileOutput");
        this.timerField = document.getElementById("TimerField");
        this.transcriptField = document.getElementById("TranscriptField");
        this.timeMarkSelector = document.getElementById("TimeMarkSelector");
        this.currentZoomFactor = 10;
        this.minimumZoomFactor = 10;
        this.zoomDelta = 5;
        this.timingList = [-1, 99999.0];
        this.soundFileName = "";
        this.transcriptFileName = "";
        this.intervalTime = 0.5;
    }
}

