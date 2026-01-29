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

    // 3. Lightbox Gallery
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementsByClassName("close")[0];

    // Add click event to all gallery images
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function () {
            lightbox.style.display = "block";
            lightboxImg.src = this.src;
            // Disable scroll on body
            document.body.style.overflow = "hidden";
        });
    });

    // Close functionality
    if (closeBtn) {
        closeBtn.onclick = function () {
            lightbox.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    // Close when clicking outside image
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });


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
                                'https://k-yb.github.io/wedding-invitation/assets/images/b98f216b2e027.jpg',
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
});
