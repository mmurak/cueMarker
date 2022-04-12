class GlobalManager {
    constructor() {
        this.versionNo = "3.01";
        this.inputFileButton = document.getElementById("InputFileButton");
        this.playButton = document.getElementById("PlayButton");
        this.playLabel = "　再生　[Sp]";
        this.pauseLabel = "一時停止[Sp]";
        this.rewind1Button = document.getElementById("Rewind1Button");
        this.secondsFromStart = document.getElementById("SecondsFromStart");
        this.zoomInButton = document.getElementById("ZoomInButton");
        this.zoomOutButton = document.getElementById("ZoomOutButton");
        this.speedRange = document.getElementById("SpeedRange");
        this.playSpeed = document.getElementById("PlaySpeed");
        this.jsFileOutput = document.getElementById("JSFileOutput");
        this.verifyButton = document.getElementById("VerifyButton");
        this.verifyPlayLabel = "確認再生";
        this.verifyPauseLabel = "確認停止";
        this.timerField = document.getElementById("TimerField");
        this.transcriptField = document.getElementById("TranscriptField");
        this.currentZoomFactor = 10;
        this.minimumZoomFactor = 10;
        this.zoomDelta = 5;
        this.timingList = [-1, 99999.0];
        this.soundFileName = "";
        this.transcriptFileName = "";
        this.spanLength = 0;
        this.processPointer = 0;
    }
}

