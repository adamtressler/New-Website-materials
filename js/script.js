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

const presidentsCarousel = document.querySelector('.presidents .album-list');
const presidentsPreviousButton = document.querySelector('.presidents-previous');
const presidentsNextButton = document.querySelector('.presidents-next');

if (presidentsCarousel && presidentsPreviousButton && presidentsNextButton) {
	const scrollAlbums = (direction) => {
		const album = presidentsCarousel.querySelector('.album-entry');
		const gap = parseFloat(getComputedStyle(presidentsCarousel).gap) || 0;
		const distance = album ? album.getBoundingClientRect().width + gap : presidentsCarousel.clientWidth;

		presidentsCarousel.scrollBy({
			left: direction * distance,
			behavior: 'smooth'
		});
	};

	presidentsPreviousButton.addEventListener('click', () => scrollAlbums(-1));
	presidentsNextButton.addEventListener('click', () => scrollAlbums(1));
}
