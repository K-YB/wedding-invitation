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


    // 2. Accordion for Contact
    const accordions = document.getElementsByClassName("accordion");
    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener("click", function () {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }

    // 3. Lightbox Gallery (prev/next + swipe + keyboard navigation)
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementsByClassName("close")[0];
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

    function openLightbox(index) {
        showImage(index);
        lightbox.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.style.display = "none";
        document.body.style.overflow = "auto";
    }

    galleryImgs.forEach((img, i) => {
        img.addEventListener('click', () => openLightbox(i));
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

    // Close when tapping the backdrop (not the image or arrows)
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation (desktop)
    document.addEventListener('keydown', function (e) {
        if (lightbox.style.display !== 'block') return;
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


    // 4. Copy to Clipboard
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', function () {
            // Find the account number (previous sibling span)
            const textToCopy = this.previousElementSibling.innerText;

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

    // 5. Kakao Share
    if (typeof Kakao !== 'undefined') {
        if (!Kakao.isInitialized()) {
            Kakao.init('635e687146ef57ff226697a370bfd61a');
        }

        const shareBtn = document.getElementById('btn-kakao-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                // Use the exact lower-case URL that matches the Kakao "Web Domain" setting
                const shareUrl = 'https://k-yb.github.io/wedding-invitation/';

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
            });
        }
    }

    // 6. Kakao Map embed
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

    // 7. Background music toggle
    const bgm = document.getElementById('bgm');
    const musicBtn = document.getElementById('music-toggle');
    if (bgm && musicBtn) {
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
    }
});
