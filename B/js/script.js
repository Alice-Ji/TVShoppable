class VideoPlayer {
  constructor() {
    // 检查必要的元素是否存在
    if (!this.initializeElements()) {
      console.error("Some required elements are missing");
      return;
    }
    this.setupPlayerControls();

    // 广告配置
    this.adBreaks = [
      {
        time: 153, // 2:33
        ads: [
          "https://dl.dropboxusercontent.com/scl/fi/3dhtg097mqr2c3y0vn41k/ad-factor-tv1.mp4?rlkey=wmwn24ib6osm777je5xxjgw5v",
        ],
      },
      {
        time: 337, // 5:37
        ads: [
          "https://dl.dropboxusercontent.com/scl/fi/d6ir9c7pjwlrpba8olfed/ad-ultima-tv1.mp4?rlkey=ytyx27finuyb722b2ufbx4ulm",
        ],
      },
    ];

    this.currentAdBreak = 0;
    this.currentAd = 0;
    this.isPlayingAd = false;
    this.setupAdContainer();
  }

  // 初始化DOM元素
  initializeElements() {
    // 视频元素
    this.mainVideo = document.getElementById("mainVideo");

    // 进度条相关元素
    this.progressBar = document.querySelector(".progress-bar");
    this.progress = document.querySelector(".progress");
    this.timeTooltip = document.querySelector(".time-tooltip");

    // 时间显示元素
    this.currentTimeDisplay = document.querySelector(".current-time");
    this.durationDisplay = document.querySelector(".duration");

    // 控制按钮
    this.playPauseBtn = document.querySelector(".play-pause");
    this.rewind10Btn = document.querySelector(".replay-10");
    this.forward10Btn = document.querySelector(".forward-10");

    // 音量控制
    this.volumeBtn = document.querySelector(".volume-btn");
    this.volumeSlider = document.querySelector(".volume-slider input");

    // 验证必要元素是否存在
    return (
      this.mainVideo &&
      this.progressBar &&
      this.progress &&
      this.timeTooltip &&
      this.currentTimeDisplay &&
      this.playPauseBtn
    );
  }

  setupAdContainer() {
    // 创建广告容器
    this.adContainer = document.createElement("div");
    this.adContainer.className = "ad-container";
    this.adContainer.style.display = "none";

    // 创建广告视频元素
    this.adVideo = document.createElement("video");
    this.adVideo.className = "ad-video";

    // 创建左侧交互界面
    this.adDetailInteraction = document.createElement("div");
    this.adDetailInteraction.className = "ad-detail-interaction";

    this.clothesGallery = [
      "assets/overlay-cardigan.jpg",
      "assets/overlay-earrings.jpg",
      "assets/overlay-polo.jpg",
      "assets/overlay-gloriatop.jpg",
      "assets/overlay-hoops.jpg",
    ];
    // 分别记录服装和iPad的购物车状态
    this.clothesCartStates = new Array(this.clothesGallery.length).fill(false);
    this.ipadCartState = false;
    this.currentGalleryIndex = 0;
    this.adDetailInteraction.innerHTML = `
            <div class="detail-container">
				<div class="gallery-container">
					<div class="nav-button left" style="display: none">
						<img src="assets/arrow-left.png" alt="Left">
					</div>
					<img src="" alt="Detail" class="detail-image">
					<div class="nav-button right" style="display: none">
						<img src="assets/arrow-right.png" alt="Right">
					</div>
					<span class="gallery-indicator" style="display: none"></span>
				</div>
				<div class="cart-hint">
					<span class="cart-text">Press</span>
					<img src="assets/pressok.png" alt="OK" class="cart-button">
					<span class="cart-text">To Add To Cart</span>
				</div>
			</div>
        `;

    // 创建交互区域
    this.adInteraction = document.createElement("div");
    this.adInteraction.className = "ad-interaction";

    // 初始交互内容
    this.defaultInteractionContent = ``;

    // 详情页面时的交互内容
    this.detailInteractionContent = `
            <div class="learn-more-container">
                <div class="learn-more-content">
                    <div class="press-row">
                        <span class="learn-text">Press</span>
                        <img src="assets/pressup.png" alt="OK" class="ok-button">
                    </div>
                    <span class="learn-text">To Close</span>
                </div>
            </div>`;

    // 服装广告的详情页交互内容
    this.clothesDefaultInteractionContent = `
            <div class="clothes-hint">
                <h1>Shop The Look</h1>
				<p>As seen in</p>
				<p>Modern Family</p>
				<p>Season 1 Episode 19</p>
            </div>
            <div class="learn-more-container">
                <div class="learn-more-content">
                    <div class="press-row">
                        <span class="learn-text">Press</span>
                        <img src="assets/pressdown.png" alt="OK" class="ok-button">
                    </div>
                    <span class="learn-text">To Learn More</span>
                </div>
            </div>`;

    this.clothesDetailInteractionContent = `
            <div class="clothes-hint">
                <h1>Shop The Look</h1>
				<p>As seen in</p>
				<p>Modern Family</p>
				<p>Season 1 Episode 19</p>
            </div>
            <div class="learn-more-container">
                <div class="learn-more-content">
                    <div class="press-row">
                        <span class="learn-text">Press</span>
                        <img src="assets/pressup.png" alt="OK" class="ok-button">
                    </div>
                    <span class="learn-text">To Close</span>
                </div>
            </div>`;

    this.adInteraction.innerHTML = this.defaultInteractionContent;
    // Create Shop Now button
    this.shopNowButton = document.createElement("button");
    this.shopNowButton.className = "shop-now-btn";
    this.shopNowButton.textContent = "Shop Now!";
    this.shopNowButton.style.display = "none";

    // shop now button talks to qualtrics
    this.shopNowButton.addEventListener("click", () => {
      console.log("🛒 Shop Now clicked!");

      // Send message to parent (Qualtrics)
      window.parent.postMessage({ shopNowClicked: true }, "*");
    });

    // Append to ad interaction area
    this.adInteraction.appendChild(this.shopNowButton);

    this.adContainer.appendChild(this.adVideo);
    this.adContainer.appendChild(this.adDetailInteraction);
    this.adContainer.appendChild(this.adInteraction);
    document.querySelector(".video-container").appendChild(this.adContainer);

    // 广告结束事件
    this.adVideo.addEventListener("ended", () => this.handleAdEnded());

    // 添加鼠标点击事件监听
    document.addEventListener("click", (e) => {
      if (
        this.isPlayingAd &&
        this.adDetailInteraction.style.display === "block"
      ) {
        const isIpadAd =
          this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
            "ad-ipadmini.mp4"
          );
        const isClothesAd =
          this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
            "ad-clothes.mp4"
          );

        if (isClothesAd || (isIpadAd && isSecondBreak)) {
          this.addToCart();
        }
      }
    });
  }

  // 显示广告详情方法
  showAdDetail() {
    this.adVideo.pause();
    this.adDetailInteraction.style.display = "block";
    const isClothesAd =
      this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
        "ad-clothes.mp4"
      );
    // 根据广告类型设置不同的交互内容
    this.adInteraction.innerHTML = isClothesAd
      ? this.clothesDetailInteractionContent
      : this.detailInteractionContent;

    // 设置初始图片
    const detailImage = this.adDetailInteraction.querySelector(".detail-image");
    const leftNav = this.adDetailInteraction.querySelector(".nav-button.left");
    const rightNav =
      this.adDetailInteraction.querySelector(".nav-button.right");
    const indicator =
      this.adDetailInteraction.querySelector(".gallery-indicator");
    const cartHint = this.adDetailInteraction.querySelector(".cart-hint");

    if (isClothesAd) {
      this.currentGalleryIndex = 0;
      detailImage.src = this.clothesGallery[0];
      this.updateGalleryIndicator();
      // 显示导航按钮和指示器
      leftNav.style.display = "flex";
      rightNav.style.display = "flex";
      indicator.style.display = "block";

      // 根据当前商品的购物车状态更新提示文本
      if (this.clothesCartStates[this.currentGalleryIndex]) {
        cartHint.innerHTML =
          '<span class="cart-text">✅ Item Added to Cart!</span>';
      } else {
        cartHint.innerHTML = `
                <span class="cart-text">Press</span>
                <img src="assets/pressok.png" alt="OK" class="cart-button">
                <span class="cart-text">To Add To Cart</span>
            `;
      }
    } else {
      detailImage.src = "assets/overlay-ipadmini.jpg";
      // 隐藏导航按钮和指示器
      leftNav.style.display = "none";
      rightNav.style.display = "none";
      indicator.style.display = "none";

      // 显示 iPad 的购物车状态
      if (this.ipadCartState) {
        cartHint.innerHTML =
          '<span class="cart-text">✅ Item Added to Cart!</span>';
      } else {
        cartHint.innerHTML = `
                <span class="cart-text">Press</span>
                <img src="assets/pressok.png" alt="OK" class="cart-button">
                <span class="cart-text">To Add To Cart</span>
            `;
      }
    }
  }

  // 添加画廊控制方法
  changeGalleryImage(direction) {
    const totalImages = this.clothesGallery.length;
    this.currentGalleryIndex =
      (this.currentGalleryIndex + direction + totalImages) % totalImages;
    const detailImage = this.adDetailInteraction.querySelector(".detail-image");
    detailImage.src = this.clothesGallery[this.currentGalleryIndex];
    this.updateGalleryIndicator();

    // 根据当前商品的购物车状态更新提示文本
    const cartHint = this.adDetailInteraction.querySelector(".cart-hint");
    const isClothesAd =
      this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
        "ad-clothes.mp4"
      );

    if (isClothesAd) {
      if (this.clothesCartStates[this.currentGalleryIndex]) {
        cartHint.innerHTML =
          '<span class="cart-text">✅ Item Added to Cart!</span>';
      } else {
        cartHint.innerHTML = `
            <span class="cart-text">Press</span>
            <img src="assets/pressok.png" alt="OK" class="cart-button">
            <span class="cart-text">To Add To Cart</span>
        `;
      }
    } else {
      if (this.ipadCartState) {
        cartHint.innerHTML =
          '<span class="cart-text">✅ Item Added to Cart!</span>';
      } else {
        cartHint.innerHTML = `
            <span class="cart-text">Press</span>
            <img src="assets/pressok.png" alt="OK" class="cart-button">
            <span class="cart-text">To Add To Cart</span>
        `;
      }
    }
  }

  // 更新画廊指示器
  updateGalleryIndicator() {
    const indicator =
      this.adDetailInteraction.querySelector(".gallery-indicator");
    indicator.textContent = `${this.currentGalleryIndex + 1} / ${
      this.clothesGallery.length
    }`;
  }

  // 添加到购物车方法
  addToCart() {
    const isClothesAd =
      this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
        "ad-clothes.mp4"
      );
    const cartHint = this.adDetailInteraction.querySelector(".cart-hint");

    if (isClothesAd) {
      this.clothesCartStates[this.currentGalleryIndex] = true;
      cartHint.innerHTML =
        '<span class="cart-text">✅ Item Added to Cart!</span>';
    } else {
      this.ipadCartState = true;
      cartHint.innerHTML =
        '<span class="cart-text">✅ Item Added to Cart!</span>';
    }
  }

  // 隐藏广告详情方法
  hideAdDetail() {
    this.adDetailInteraction.style.display = "none";
    const isClothesAd =
      this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
        "ad-clothes.mp4"
      );
    // 根据广告类型设置不同的交互内容
    this.adInteraction.innerHTML = isClothesAd
      ? this.clothesDefaultInteractionContent
      : this.defaultInteractionContent;

    this.adVideo.play();
  }

  // 检查是否需要播放广告
  checkForAds() {
    if (this.isPlayingAd) return;

    const currentTime = Math.floor(this.mainVideo.currentTime);
    const currentBreak = this.adBreaks[this.currentAdBreak];

    if (currentBreak && currentTime >= currentBreak.time) {
      this.playAdBreak();
    }
  }

  // 播放广告组
  playAdBreak() {
    this.isPlayingAd = true;
    this.mainVideo.pause();
    this.adContainer.style.display = "block";
    this.currentAd = 0;
    this.playCurrentAd();
  }

  // 播放当前广告
  playCurrentAd() {
    const currentBreak = this.adBreaks[this.currentAdBreak];
    const currentAdUrl = currentBreak.ads[this.currentAd];
    this.adVideo.src = currentAdUrl;

    const isUltimaAd = currentAdUrl.includes("ad-ultima-tv1.mp4");
    const isIpadAd = currentAdUrl.includes("ad-ipadmini.mp4");
    const isClothesAd = currentAdUrl.includes("ad-clothes.mp4");
    const isSecondBreak = this.currentAdBreak === 0;

    // Reset interaction container first
    this.adInteraction.innerHTML = isClothesAd
      ? this.clothesDefaultInteractionContent
      : this.defaultInteractionContent;

    // Append Shop Now button AFTER setting innerHTML
    this.adInteraction.appendChild(this.shopNowButton);

    // Toggle display
    this.shopNowButton.style.display = isUltimaAd ? "block" : "none";
    this.adInteraction.style.display =
      isUltimaAd || isClothesAd || (isIpadAd && isSecondBreak)
        ? "flex"
        : "none";

    this.adVideo.play();
  }

  // 处理广告结束
  handleAdEnded() {
    this.isPlayingAd = false;
    this.adContainer.style.display = "none";
    // hide shop now button when ad ends
    this.shopNowButton.style.display = "none";

    // Ensure the ad break doesn't trigger again
    this.currentAdBreak++;

    // Resume the main video
    this.mainVideo.play();
  }

  // 设置播放器控制事件
  setupPlayerControls() {
    // 播放控制
    this.setupPlaybackControls();

    // 进度条控制
    this.setupProgressControls();

    // 音量控制
    this.setupVolumeControls();

    // 时间更新
    this.setupTimeUpdates();

    // 键盘控制
    this.setupKeyboardControls();
  }

  // 播放控制相关事件
  setupPlaybackControls() {
    this.playPauseBtn.addEventListener("click", () => this.togglePlay());
    this.mainVideo.addEventListener("click", () => this.togglePlay());
    this.rewind10Btn.addEventListener("click", () => this.skip(-10));
    this.forward10Btn.addEventListener("click", () => this.skip(10));
  }

  // 进度条相关事件
  setupProgressControls() {
    this.progressBar.addEventListener("mousemove", (e) =>
      this.handleProgressHover(e)
    );
    this.progressBar.addEventListener("mouseleave", () =>
      this.hideProgressTooltip()
    );
    this.progressBar.addEventListener("click", (e) =>
      this.handleProgressClick(e)
    );
  }

  // 音量控制相关事件
  setupVolumeControls() {
    this.volumeBtn.addEventListener("click", () => this.toggleMute());
    this.volumeSlider.addEventListener("input", (e) =>
      this.handleVolumeChange(e)
    );
  }

  // 时间更新相关事件
  setupTimeUpdates() {
    this.mainVideo.addEventListener("timeupdate", () => {
      this.updateProgress();
      this.checkForAds();
    });
    this.mainVideo.addEventListener("loadedmetadata", () =>
      this.updateDuration()
    );
  }

  // 键盘控制事件
  setupKeyboardControls() {
    document.addEventListener("keydown", (e) => this.handleKeypress(e));
  }

  // 播放控制方法
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

  // 进度条控制方法
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

  // 时间更新方法
  updateProgress() {
    const percent =
      (this.mainVideo.currentTime / this.mainVideo.duration) * 100;
    this.progress.style.setProperty("--progress-width", `${percent}%`);
    this.currentTimeDisplay.textContent = this.formatTime(
      this.mainVideo.currentTime
    );
  }

  updateDuration() {
    const duration = this.mainVideo.duration;
    this.durationDisplay.textContent = this.formatTime(duration);
  }

  // 音量控制方法
  toggleMute() {
    this.mainVideo.muted = !this.mainVideo.muted;
    this.volumeBtn.innerHTML = `<span class="icon ${
      this.mainVideo.muted ? "mute" : "sound"
    }"></span>`;
  }

  handleVolumeChange(e) {
    this.mainVideo.volume = e.target.value / 100;
    const iconName = e.target.value > 0 ? "sound" : "mute";
    this.volumeBtn.innerHTML = `<span class="icon ${iconName}"></span>`;
  }

  // 键盘控制方法
  handleKeypress(e) {
    if (this.isPlayingAd) {
      const isIpadAd =
        this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
          "ad-ipadmini.mp4"
        );
      const isSecondBreak = this.currentAdBreak === 0;
      const isClothesAd =
        this.adBreaks[this.currentAdBreak]?.ads[this.currentAd].includes(
          "ad-clothes.mp4"
        );

      if ((isIpadAd && isSecondBreak) || isClothesAd) {
        switch (e.key.toLowerCase()) {
          case "arrowdown":
            e.preventDefault();
            this.showAdDetail();
            break;
          case "arrowup":
            e.preventDefault();
            this.hideAdDetail();
            break;
          case "arrowleft":
            if (
              isClothesAd &&
              this.adDetailInteraction.style.display === "block"
            ) {
              e.preventDefault();
              this.changeGalleryImage(-1);
            }
            break;
          case "arrowright":
            if (
              isClothesAd &&
              this.adDetailInteraction.style.display === "block"
            ) {
              e.preventDefault();
              this.changeGalleryImage(1);
            }
            break;
          case "enter": // 添加回车键支持
          case " ": // 添加空格键支持
            if (this.adDetailInteraction.style.display === "block") {
              e.preventDefault();
              this.addToCart();
            }
            break;
        }
        return;
      }
    }

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
      case "j":
        e.preventDefault();
        this.skip(-5); // 快退5秒
        break;
      case "l":
        e.preventDefault();
        this.skip(5); // 快进5秒
        break;
      case "m":
        e.preventDefault();
        this.toggleMute();
        break;
      case "f":
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case "arrowup":
        e.preventDefault();
        this.changeVolume(0.1); // 增加音量
        break;
      case "arrowdown":
        e.preventDefault();
        this.changeVolume(-0.1); // 减少音量
        break;
    }
  }

  // 全屏控制方法
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch((err) => {
        console.error(`全屏错误: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // 音量调节方法
  changeVolume(delta) {
    let newVolume = this.mainVideo.volume + delta;
    newVolume = Math.max(0, Math.min(1, newVolume)); // 限制在0-1之间
    this.mainVideo.volume = newVolume;
    this.volumeSlider.value = newVolume * 100;

    // 更新音量图标
    const iconName = newVolume > 0 ? "sound" : "mute";
    this.volumeBtn.innerHTML = `<span class="icon ${iconName}"></span>`;
  }

  // 工具方法
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// 初始化播放器
document.addEventListener("DOMContentLoaded", () => {
  new VideoPlayer();
});
