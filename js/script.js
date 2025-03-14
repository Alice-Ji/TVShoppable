class VideoPlayer {
  constructor() {
    if (!this.initializeElements()) {
      console.error("Some required elements are missing");
      return;
    }
    this.setupPlayerControls();

    // Ad break at 2:33 (153 seconds)
    this.adTime = 153;
    this.isPlayingAd = false;

    this.setupAdContainer();
  }

  initializeElements() {
    this.mainVideo = document.getElementById("mainVideo");
    this.adVideo = document.getElementById("adVideo");
    this.adOverlay = document.getElementById("adOverlay");

    // Debugging log to confirm video element is loaded
    console.log("Main video element:", this.mainVideo);

    this.progressBar = document.querySelector(".progress-bar");
    this.progress = document.querySelector(".progress");
    this.timeTooltip = document.querySelector(".time-tooltip");

    this.currentTimeDisplay = document.querySelector(".current-time");
    this.durationDisplay = document.querySelector(".duration");

    this.playPauseBtn = document.querySelector(".play-pause");
    this.rewind10Btn = document.querySelector(".replay-10");
    this.forward10Btn = document.querySelector(".forward-10");

    this.volumeBtn = document.querySelector(".volume-btn");
    this.volumeSlider = document.querySelector(".volume-slider input");

    if (!this.mainVideo || !this.adVideo || !this.adOverlay) {
      console.error("Missing video elements");
      return false;
    }

    // Ensure the metadata is loaded to get duration
    this.mainVideo.addEventListener("loadedmetadata", () =>
      this.updateDuration()
    );

    return true;
  }

  setupAdContainer() {
    this.adVideo.style.display = "none";
    this.adOverlay.style.display = "none";

    // Show overlay when ad starts
    this.adVideo.addEventListener("play", () => {
      this.adOverlay.style.display = "flex";
    });

    // Hide overlay and resume main video after ad ends
    this.adVideo.addEventListener("ended", () => {
      this.adOverlay.style.display = "none";
      this.adVideo.style.display = "none";
      this.mainVideo.style.display = "block";
      this.isPlayingAd = false;
      this.mainVideo.play();
    });
  }

  checkForAdBreak() {
    if (this.isPlayingAd) return;

    if (Math.floor(this.mainVideo.currentTime) >= this.adTime) {
      this.playAd();
    }
  }

  playAd() {
    this.isPlayingAd = true;
    this.mainVideo.pause();
    this.mainVideo.style.visibility = "hidden";
    this.adVideo.style.visibility = "visible";

    this.adVideo.play();
  }

  setupPlayerControls() {
    this.playPauseBtn.addEventListener("click", () => this.togglePlay());
    this.mainVideo.addEventListener("click", () => this.togglePlay());
    this.rewind10Btn.addEventListener("click", () => this.skip(-10));
    this.forward10Btn.addEventListener("click", () => this.skip(10));

    this.progressBar.addEventListener("mousemove", (e) =>
      this.handleProgressHover(e)
    );
    this.progressBar.addEventListener("mouseleave", () =>
      this.hideProgressTooltip()
    );
    this.progressBar.addEventListener("click", (e) =>
      this.handleProgressClick(e)
    );

    this.volumeBtn.addEventListener("click", () => this.toggleMute());
    this.volumeSlider.addEventListener("input", (e) =>
      this.handleVolumeChange(e)
    );

    this.mainVideo.addEventListener("timeupdate", () => {
      this.updateProgress();
      this.checkForAdBreak();
    });

    document.addEventListener("keydown", (e) => this.handleKeypress(e));
  }

  togglePlay() {
    if (this.isPlayingAd) return;
    if (this.mainVideo.paused) {
      this.mainVideo.play();
      this.playPauseBtn.innerHTML = '<span class="icon pause"></span>';
    } else {
      this.mainVideo.pause();
      this.playPauseBtn.innerHTML = '<span class="icon play"></span>';
    }
  }

  skip(seconds) {
    if (this.isPlayingAd) return;
    this.mainVideo.currentTime += seconds;
  }

  handleProgressHover(e) {
    if (this.isPlayingAd) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * this.mainVideo.duration;
    this.timeTooltip.textContent = this.formatTime(time);
    this.timeTooltip.style.display = "block";
    this.timeTooltip.style.left = `${e.clientX - rect.left}px`;
  }

  hideProgressTooltip() {
    this.timeTooltip.style.display = "none";
  }

  handleProgressClick(e) {
    const percent = e.offsetX / this.progressBar.offsetWidth;
    this.mainVideo.currentTime = percent * this.mainVideo.duration;
  }

  updateProgress() {
    const percent =
      (this.mainVideo.currentTime / this.mainVideo.duration) * 100;
    this.progress.style.width = `${percent}%`;
    this.currentTimeDisplay.textContent = this.formatTime(
      this.mainVideo.currentTime
    );
  }

  updateDuration() {
    console.log("Duration:", this.mainVideo.duration); // Debugging log
    this.durationDisplay.textContent = this.formatTime(this.mainVideo.duration);
  }

  toggleMute() {
    this.mainVideo.muted = !this.mainVideo.muted;
    this.volumeBtn.innerHTML = `<span class="icon ${
      this.mainVideo.muted ? "mute" : "sound"
    }"></span>`;
  }

  handleVolumeChange(e) {
    this.mainVideo.volume = e.target.value / 100;
    this.volumeBtn.innerHTML = `<span class="icon ${
      this.mainVideo.volume > 0 ? "sound" : "mute"
    }"></span>`;
  }

  handleKeypress(e) {
    if (this.isPlayingAd) return;

    switch (e.key.toLowerCase()) {
      case " ":
      case "k":
        e.preventDefault();
        this.togglePlay();
        break;
      case "arrowleft":
        e.preventDefault();
        this.skip(-10);
        break;
      case "arrowright":
        e.preventDefault();
        this.skip(10);
        break;
      case "m":
        e.preventDefault();
        this.toggleMute();
        break;
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Initialize the video player
document.addEventListener("DOMContentLoaded", () => {
  new VideoPlayer();
});
