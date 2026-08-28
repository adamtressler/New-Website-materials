const watchCarousel = document.querySelector('.watch-carousel');
const previousButton = document.querySelector('.watch-previous');
const nextButton = document.querySelector('.watch-next');
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
}

