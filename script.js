document.addEventListener('DOMContentLoaded', () => {

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


    // 2. Lightbox Gallery (natural swipe carousel + arrows + keyboard)
    const lightbox = document.getElementById('lightbox');
    const track = document.getElementById('lb-track');
    const prevBtn = document.querySelector('.lb-prev');
    const nextBtn = document.querySelector('.lb-next');
    const counter = document.getElementById('lb-counter');

    const galleryImgs = Array.from(document.querySelectorAll('.gallery-item img'));
    const lastIndex = galleryImgs.length - 1;
    let currentIndex = 0;
    let slidesBuilt = false;

    // Build the sliding track once: every photo becomes a horizontal slide
    function buildSlides() {
        if (slidesBuilt || !track) return;
        galleryImgs.forEach((img) => {
            const slide = document.createElement('div');
            slide.className = 'lb-slide';
            const full = document.createElement('img');
            full.src = img.src;
            full.alt = img.alt || '';
            full.draggable = false;
            slide.appendChild(full);
            track.appendChild(slide);
        });
        slidesBuilt = true;
    }

    function vw() { return lightbox.clientWidth; }

    function setTrack(offsetPx, animate) {
        track.style.transition = animate ? 'transform 0.3s ease' : 'none';
        track.style.transform = 'translate3d(' + (-currentIndex * vw() + offsetPx) + 'px, 0, 0)';
    }

    function updateCounter() {
        if (counter) counter.textContent = (currentIndex + 1) + ' / ' + galleryImgs.length;
    }

    function goTo(index, animate) {
        currentIndex = Math.max(0, Math.min(index, lastIndex));
        setTrack(0, animate);
        updateCounter();
    }

    // Pushing a history entry lets the mobile back button close the lightbox
    // (instead of leaving the page), so a visible X button isn't needed.
    let lightboxHistoryActive = false;

    function openLightbox(index) {
        buildSlides();
        currentIndex = index;
        lightbox.classList.add('open');
        document.body.style.overflow = "hidden";
        setTrack(0, false); // position instantly (reads width after display:block)
        updateCounter();
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

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(currentIndex - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(currentIndex + 1, true); });

    // Keyboard navigation (desktop)
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'ArrowLeft') goTo(currentIndex - 1, true);
        else if (e.key === 'ArrowRight') goTo(currentIndex + 1, true);
        else if (e.key === 'Escape') closeLightbox();
    });

    // Drag / swipe: the photo follows the pointer, then snaps to the nearest slide
    let dragging = false, moved = false, horizontal = null;
    let startX = 0, startY = 0, deltaX = 0;

    function onDown(e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.target.closest('.lb-nav')) return; // arrows handle their own clicks
        dragging = true;
        moved = false;
        horizontal = null;
        startX = e.clientX;
        startY = e.clientY;
        deltaX = 0;
    }

    function onMove(e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // Lock the axis on the first meaningful movement
        if (horizontal === null) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            horizontal = Math.abs(dx) >= Math.abs(dy);
        }
        if (!horizontal) return;
        moved = true;
        deltaX = dx;
        // Add resistance when dragging past the first/last photo
        if ((currentIndex === 0 && dx > 0) || (currentIndex === lastIndex && dx < 0)) {
            deltaX = dx * 0.35;
        }
        setTrack(deltaX, false);
    }

    function onUp() {
        if (!dragging) return;
        dragging = false;
        const threshold = Math.min(70, vw() * 0.16);
        if (horizontal && deltaX <= -threshold) goTo(currentIndex + 1, true);
        else if (horizontal && deltaX >= threshold) goTo(currentIndex - 1, true);
        else setTrack(0, true); // not far enough -> spring back
        deltaX = 0;
        horizontal = null;
        // Keep `moved` truthy through the click that follows a drag, then clear it
        setTimeout(() => { moved = false; }, 0);
    }

    if (track) {
        track.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    // Tap the backdrop (not the photo, not right after a drag) to close
    lightbox.addEventListener('click', function (e) {
        if (moved) return;
        if (e.target.closest('.lb-nav')) return;
        if (e.target.tagName === 'IMG') return;
        closeLightbox();
    });

    // Keep the current slide aligned if the viewport size / orientation changes
    window.addEventListener('resize', function () {
        if (lightbox.classList.contains('open')) setTrack(0, false);
    });


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

    // 5.1 D-Day counter (wedding: 2026-09-06)
    const ddayNum = document.getElementById('dday-num');
    const ddayText = document.getElementById('dday-text');
    if (ddayNum && ddayText) {
        const wedding = new Date(2026, 8, 6); // month is 0-indexed → 8 = September
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diff = Math.round((wedding - today) / 86400000);
        if (diff > 0) {
            ddayNum.textContent = 'D-' + diff;
            ddayText.textContent = '영빈 ♥ 도연의 결혼식이 ' + diff + '일 남았습니다.';
        } else if (diff === 0) {
            ddayNum.textContent = 'D-DAY';
            ddayText.textContent = '오늘은 영빈 ♥ 도연의 결혼식 날입니다.';
        } else {
            ddayNum.textContent = 'D+' + Math.abs(diff);
            ddayText.textContent = '영빈 ♥ 도연이 부부가 된 지 ' + Math.abs(diff) + '일이 되었습니다.';
        }
    }

    // 5.2 Account accordions (expand/collapse)
    document.querySelectorAll('.accordion').forEach((btn) => {
        btn.addEventListener('click', function () {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + 'px';
            }
        });
    });

    // 5.3 Gallery "더보기" (reveal hidden photos)
    const galleryMoreBtn = document.getElementById('gallery-more');
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryMoreBtn && galleryGrid) {
        galleryMoreBtn.addEventListener('click', () => {
            galleryGrid.classList.add('expanded');
            galleryGrid.querySelectorAll('.more-hidden').forEach((el) => el.classList.add('visible'));
            galleryMoreBtn.style.display = 'none';
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
