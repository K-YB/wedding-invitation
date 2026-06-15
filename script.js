document.addEventListener('DOMContentLoaded', () => {

    // 0. Intro video: play the clip once (muted), then fade out. Tap to skip.
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay) {
        const introVideo = document.getElementById('intro-video');
        let introDone = false;
        const dismissIntro = () => {
            if (introDone) return;
            introDone = true;
            introOverlay.classList.add('hide');
            document.body.style.overflow = '';
            setTimeout(() => introOverlay.remove(), 900);
        };
        document.body.style.overflow = 'hidden';
        if (introVideo) {
            introVideo.addEventListener('ended', dismissIntro);
            introVideo.addEventListener('error', dismissIntro);
            const playPromise = introVideo.play();
            if (playPromise && playPromise.catch) playPromise.catch(() => setTimeout(dismissIntro, 400));
        } else {
            dismissIntro();
        }
        introOverlay.addEventListener('click', dismissIntro); // tap anywhere to skip
        setTimeout(dismissIntro, 6000);                       // safety: never trap the user
    }

    // 1. Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));


    // 2. Lightbox Gallery (prev/next + swipe + keyboard navigation)
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById("lightbox-img");
    const prevBtn = document.querySelector('.lb-prev');
    const nextBtn = document.querySelector('.lb-next');
    const counter = document.getElementById('lb-counter');

    const galleryImgs = Array.from(document.querySelectorAll('.gallery-item img'));
    let currentIndex = 0;

    function showImage(index) {
        // Wrap around at both ends
        currentIndex = (index + galleryImgs.length) % galleryImgs.length;
        lightboxImg.src = galleryImgs[currentIndex].src;
        if (counter) counter.textContent = (currentIndex + 1) + ' / ' + galleryImgs.length;
        lightbox.scrollTop = 0;
    }

    // Pushing a history entry lets the mobile back button close the lightbox
    // (instead of leaving the page), so a visible X button isn't needed.
    let lightboxHistoryActive = false;

    function openLightbox(index) {
        showImage(index);
        lightbox.classList.add('open');
        document.body.style.overflow = "hidden";
        if (!lightboxHistoryActive) {
            history.pushState({ lightbox: true }, '');
            lightboxHistoryActive = true;
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = "auto";
        if (lightboxHistoryActive) {
            lightboxHistoryActive = false;
            history.back(); // pop the entry we pushed when opening
        }
    }

    // Browser/OS back button: close the lightbox rather than navigating away.
    window.addEventListener('popstate', function () {
        if (lightbox.classList.contains('open')) {
            lightboxHistoryActive = false;
            lightbox.classList.remove('open');
            document.body.style.overflow = "auto";
        }
    });

    galleryImgs.forEach((img, i) => {
        img.addEventListener('click', () => openLightbox(i));
    });

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

    // Close when tapping the backdrop (not the image or arrows)
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation (desktop)
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        else if (e.key === 'ArrowRight') showImage(currentIndex + 1);
        else if (e.key === 'Escape') closeLightbox();
    });

    // Touch swipe navigation (mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    lightbox.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        // Treat as a swipe only when the horizontal move dominates (lets tall photos scroll vertically)
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) showImage(currentIndex + 1); // swipe left -> next
            else showImage(currentIndex - 1);        // swipe right -> prev
        }
    }, { passive: true });


    // 3. Copy to Clipboard
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', function () {
            // Prefer the exact account number from data-copy; fall back to sibling text
            const textToCopy = this.dataset.copy || this.previousElementSibling.innerText;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.innerText;
                this.innerText = "복사완료";
                this.style.background = "#f0f0f0";

                setTimeout(() => {
                    this.innerText = originalText;
                    this.style.background = "#fff";
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert("복사에 실패했습니다. 직접 복사해주세요.");
            });
        });
    });

    // 4. Kakao Share
    if (typeof Kakao !== 'undefined') {
        if (!Kakao.isInitialized()) {
            Kakao.init('635e687146ef57ff226697a370bfd61a');
        }

        // Use the exact lower-case URL that matches the Kakao "Web Domain" setting
        const shareUrl = 'https://k-yb.github.io/wedding-invitation/';
        const shareKakao = () => {
            try {
                Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: '김영빈 ♥ 김도연 결혼합니다',
                        description: '2026년 9월 6일 일요일 오후 2시\n더 화이트 베일',
                        imageUrl:
                            'https://k-yb.github.io/wedding-invitation/assets/images/share-thumbnail.jpg',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '모바일 청첩장 보기',
                            link: {
                                mobileWebUrl: shareUrl,
                                webUrl: shareUrl,
                            },
                        },
                    ],
                });
            } catch (err) {
                console.error(err);
                alert('카카오톡 공유 도중 오류가 발생했습니다.');
            }
        };

        // Bottom button + top-right floating button trigger the same share
        ['btn-kakao-share', 'share-toggle'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', shareKakao);
        });
    }

    // 5. Kakao Map embed
    const mapContainer = document.getElementById('map');
    if (mapContainer && typeof kakao !== 'undefined' && kakao.maps) {
        kakao.maps.load(function () {
            const map = new kakao.maps.Map(mapContainer, {
                center: new kakao.maps.LatLng(37.4923, 127.0292), // temporary; recentered after geocoding
                level: 3,
            });
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch('서울 서초구 서초중앙로 14', function (result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    const lat = result[0].y;
                    const lng = result[0].x;
                    const coords = new kakao.maps.LatLng(lat, lng);
                    map.setCenter(coords);
                    const marker = new kakao.maps.Marker({ map: map, position: coords });
                    const infowindow = new kakao.maps.InfoWindow({
                        content: '<div style="padding:6px 12px;font-size:13px;white-space:nowrap;">더 화이트 베일</div>',
                    });
                    infowindow.open(map, marker);

                    // Open the "카카오맵" button at this pinned location instead of a bare search
                    const kakaoBtn = document.querySelector('.btn-map.kakao');
                    if (kakaoBtn) {
                        kakaoBtn.href = 'https://map.kakao.com/link/map/더 화이트 베일,' + lat + ',' + lng;
                    }
                }
            });
        });
    }

    // 6. Background music toggle
    const bgm = document.getElementById('bgm');
    const musicBtn = document.getElementById('music-toggle');
    if (bgm && musicBtn) {
        bgm.volume = 0.5; // soften background music a bit
        let userPaused = false;

        const setUI = (playing) => {
            musicBtn.classList.toggle('playing', playing);
            musicBtn.classList.toggle('paused', !playing);
        };
        const tryPlay = () => {
            bgm.play().catch(() => setUI(false));
        };

        bgm.addEventListener('play', () => setUI(true));
        bgm.addEventListener('pause', () => setUI(false));

        // Attempt autoplay; browsers usually require a user gesture first.
        tryPlay();

        // Fallback: start on the first interaction, unless the user paused it.
        const events = ['click', 'touchstart', 'scroll'];
        const startOnce = () => {
            if (!userPaused && bgm.paused) tryPlay();
            events.forEach((ev) => document.removeEventListener(ev, startOnce));
        };
        events.forEach((ev) => document.addEventListener(ev, startOnce, { passive: true }));

        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgm.paused) {
                userPaused = false;
                tryPlay();
            } else {
                userPaused = true;
                bgm.pause();
            }
        });

        // Don't keep playing in the background: pause when the page is hidden
        // (tab/app switch, screen lock); resume on return unless the user paused.
        let resumeOnVisible = false;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                resumeOnVisible = !bgm.paused;
                bgm.pause();
            } else if (resumeOnVisible && !userPaused) {
                tryPlay();
            }
        });
    }
});
