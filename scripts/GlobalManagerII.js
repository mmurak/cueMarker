class GlobalManager {
    constructor() {
        this.inputFileButton = document.getElementById("InputFileButton");
        this.playButton = document.getElementById("PlayButton");
        this.speedSelector = document.getElementById("SpeedSelector");
        this.jsonJsFileOutput = document.getElementById("JSONJSFileOutput");
        this.timerField = document.getElementById("TimerField");
        this.transcriptField = document.getElementById("TranscriptField");
        this.timeMarkSelector = document.getElementById("TimeMarkSelector");
        this.timingList = [-1, 99999.0];
        this.soundFileName = "";
        this.transcriptFileName = "";
        this.intervalTime = 0.5;
    }
}

