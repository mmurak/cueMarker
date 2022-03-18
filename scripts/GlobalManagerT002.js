class GlobalManager {
    constructor() {
        this.playButton = document.getElementById("PlayButton");
        this.speedSelector = document.getElementById("SpeedSelector");
        this.displayField = document.getElementById("DisplayField");
        this.markButton = document.getElementById("MarkButton");
        this.hideShowButton = document.getElementById("HideShowButton");
        this.hidden = true;
        this.timingList = [];
        this.transcript = "";
        this.markList = [];
        this.qSelector = document.getElementById("QSelector");
    }
}

