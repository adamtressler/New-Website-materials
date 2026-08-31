function parseYouTubeTimestamp(value) {
	if (!value) return 0;
	if (/^\d+$/.test(value)) return parseInt(value, 10);

	const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
	if (!match) return 0;

	const hours = parseInt(match[1], 10) || 0;
	const minutes = parseInt(match[2], 10) || 0;
	const seconds = parseInt(match[3], 10) || 0;

	return hours * 3600 + minutes * 60 + seconds;
}

function parseYouTubeUrl(rawUrl) {
	let url;
	try {
		url = new URL(rawUrl);
	} catch (error) {
		return null;
	}

	const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
	let id = null;

	if (host === 'youtu.be') {
		id = url.pathname.split('/').filter(Boolean)[0];
	} else if (host === 'youtube.com') {
		if (url.pathname === '/watch') {
			id = url.searchParams.get('v');
		} else if (url.pathname.startsWith('/embed/')) {
			id = url.pathname.split('/embed/')[1];
		} else if (url.pathname.startsWith('/shorts/')) {
			id = url.pathname.split('/shorts/')[1];
		}
	}

	if (!id) return null;
	id = id.split('/')[0];

	const start = parseYouTubeTimestamp(url.searchParams.get('t') || url.searchParams.get('start'));

	return { id, start };
}

const watchCarousel = document.querySelector('.watch-carousel');
const previousButton = document.querySelector('.watch-previous');
const nextButton = document.querySelector('.watch-next');
const watchLightbox = document.getElementById('watch-lightbox');
let openWatchLightbox = null;
const navigation = document.querySelector('.site-nav');
const navigationToggle = document.querySelector('.site-nav-toggle');

if (navigation && navigationToggle) {
	 navigationToggle.addEventListener('click', () => {
		const isOpen = navigation.classList.toggle('is-open');
		navigationToggle.setAttribute('aria-expanded', String(isOpen));
	});

	navigation.querySelectorAll('.site-nav-links a').forEach((link) => {
		link.addEventListener('click', () => {
			navigation.classList.remove('is-open');
			navigationToggle.setAttribute('aria-expanded', 'false');
		});
	});
}

if (watchCarousel && previousButton && nextButton) {
	const scrollVideos = (direction) => {
		const video = watchCarousel.querySelector('.watch-video');
		const gap = parseFloat(getComputedStyle(watchCarousel).gap) || 0;
		const distance = video ? video.getBoundingClientRect().width + gap : watchCarousel.clientWidth;

		watchCarousel.scrollBy({
			left: direction * distance,
			behavior: 'smooth'
		});
	};

	previousButton.addEventListener('click', () => scrollVideos(-1));
	nextButton.addEventListener('click', () => scrollVideos(1));

	const DRAG_THRESHOLD = 6;
	let isDragging = false;
	let hasDragged = false;
	let startX = 0;
	let startScrollLeft = 0;

	const onPointerMove = (event) => {
		if (!isDragging) return;

		const delta = event.clientX - startX;
		if (!hasDragged && Math.abs(delta) > DRAG_THRESHOLD) hasDragged = true;
		if (hasDragged) watchCarousel.scrollLeft = startScrollLeft - delta;
	};

	const stopDragging = () => {
		if (!isDragging) return;
		isDragging = false;
		watchCarousel.classList.remove('is-dragging');
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', stopDragging);
	};

	watchCarousel.addEventListener('pointerdown', (event) => {
		if (event.pointerType !== 'mouse' || event.button !== 0) return;

		isDragging = true;
		hasDragged = false;
		startX = event.clientX;
		startScrollLeft = watchCarousel.scrollLeft;
		watchCarousel.classList.add('is-dragging');
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', stopDragging);
	});

	watchCarousel.querySelectorAll('.watch-video').forEach((link) => {
		link.addEventListener('click', (event) => {
			if (hasDragged) {
				event.preventDefault();
				hasDragged = false;
				return;
			}

			if (openWatchLightbox && openWatchLightbox(link)) {
				event.preventDefault();
			}
		});
	});
}

let activeEmbedWindow = null;
let activeEmbedOnError = null;

function sendYouTubeListeningHandshake(target) {
	const message = JSON.stringify({ event: 'listening', id: 1, channel: 'widget' });

	[0, 250, 750, 1500].forEach((delay) => {
		window.setTimeout(() => {
			if (target !== activeEmbedWindow) return;
			try {
				target.postMessage(message, '*');
			} catch (error) {
				/* ignore */
			}
		}, delay);
	});
}

window.addEventListener('message', (event) => {
	if (event.origin !== 'https://www.youtube.com') return;
	if (!activeEmbedWindow || event.source !== activeEmbedWindow) return;

	let data;
	try {
		data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
	} catch (error) {
		return;
	}

	if (data && data.event === 'onError' && typeof activeEmbedOnError === 'function') {
		activeEmbedOnError();
	}
});

if (watchLightbox) {
	const dialog = watchLightbox.querySelector('.watch-lightbox-dialog');
	const frame = watchLightbox.querySelector('.watch-lightbox-frame');
	const closeButton = watchLightbox.querySelector('.watch-lightbox-close');
	const backdrop = watchLightbox.querySelector('[data-watch-lightbox-close]');
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let triggerElement = null;

	const getFocusableElements = () => Array.from(
		watchLightbox.querySelectorAll('button, iframe, [href]')
	);

	const trapFocus = (event) => {
		if (event.key !== 'Tab') return;

		const focusable = getFocusableElements();
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	const onKeydown = (event) => {
		if (event.key === 'Escape') {
			closeWatchLightbox();
		} else {
			trapFocus(event);
		}
	};

	function showEmbedFallback(url) {
		frame.innerHTML = '';

		const fallback = document.createElement('div');
		fallback.className = 'watch-lightbox-fallback';

		const message = document.createElement('p');
		message.textContent = "This video can't be played here.";

		const watchLink = document.createElement('a');
		watchLink.href = url;
		watchLink.target = '_blank';
		watchLink.rel = 'noopener noreferrer';
		watchLink.textContent = 'Watch on YouTube →';

		fallback.append(message, watchLink);
		frame.appendChild(fallback);
	}

	function closeWatchLightbox() {
		if (watchLightbox.hidden) return;

		watchLightbox.classList.remove('is-open');
		document.body.classList.remove('watch-lightbox-open');
		document.removeEventListener('keydown', onKeydown);

		const finish = () => {
			watchLightbox.hidden = true;
			activeEmbedWindow = null;
			activeEmbedOnError = null;
			frame.innerHTML = '';
			if (triggerElement) triggerElement.focus();
		};

		if (prefersReducedMotion.matches) {
			finish();
		} else {
			let finished = false;
			const onTransitionEnd = () => {
				if (finished) return;
				finished = true;
				finish();
			};

			dialog.addEventListener('transitionend', onTransitionEnd, { once: true });
			window.setTimeout(() => {
				if (finished) return;
				finished = true;
				dialog.removeEventListener('transitionend', onTransitionEnd);
				finish();
			}, 300);
		}
	}

	openWatchLightbox = (link) => {
		const parsed = parseYouTubeUrl(link.href);
		if (!parsed) return false;

		triggerElement = link;

		const params = new URLSearchParams({
			autoplay: '1',
			rel: '0',
			modestbranding: '1',
			playsinline: '1',
			enablejsapi: '1'
		});
		if (parsed.start > 0) params.set('start', String(parsed.start));

		const image = link.querySelector('img');
		const iframe = document.createElement('iframe');
		iframe.src = `https://www.youtube.com/embed/${parsed.id}?${params.toString()}`;
		iframe.title = image ? image.alt : 'YouTube video player';
		iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
		iframe.allowFullscreen = true;
		iframe.setAttribute('frameborder', '0');

		frame.innerHTML = '';
		frame.appendChild(iframe);

		activeEmbedOnError = () => showEmbedFallback(link.href);
		iframe.addEventListener('load', () => {
			activeEmbedWindow = iframe.contentWindow;
			sendYouTubeListeningHandshake(iframe.contentWindow);
		});

		watchLightbox.hidden = false;
		document.body.classList.add('watch-lightbox-open');

		requestAnimationFrame(() => {
			watchLightbox.classList.add('is-open');
		});

		document.addEventListener('keydown', onKeydown);
		closeButton.focus();

		return true;
	};

	closeButton.addEventListener('click', closeWatchLightbox);
	backdrop.addEventListener('click', closeWatchLightbox);
}

