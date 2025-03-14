document.addEventListener("DOMContentLoaded", () => {
  let mainVideo = document.getElementById("mainVideo");
  let adVideo = document.getElementById("adVideo");

  let adTime = 153; // Ad should play at 2:33 (153 seconds)
  let isAdPlaying = false;

  mainVideo.addEventListener("timeupdate", () => {
    if (!isAdPlaying && mainVideo.currentTime >= adTime) {
      playAd();
    }
  });

  function playAd() {
    console.log("Switching to Ad...");
    isAdPlaying = true;

    // Pause main video and hide it
    mainVideo.pause();
    mainVideo.style.visibility = "hidden";

    // Show and play ad video
    adVideo.style.visibility = "visible";
    adVideo.controls = false; // Remove controls
    adVideo.play();

    // Prevent pausing/skipping
    adVideo.addEventListener("pause", () => adVideo.play());
    adVideo.addEventListener("seeking", () => (adVideo.currentTime = 0));
  }

  adVideo.addEventListener("ended", () => {
    console.log("Ad ended. Returning to main video...");
    adVideo.style.visibility = "hidden";
    mainVideo.style.visibility = "visible";
    isAdPlaying = false;
    mainVideo.play();
  });
});
