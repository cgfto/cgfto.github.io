// Small helpers
// Populate year
(function(){
  var el = document.getElementById('year');
  if(el) el.textContent = new Date().getFullYear();
})();

// DOM ready
document.addEventListener('DOMContentLoaded', function(){
  // Build Google Calendar links for schedule buttons
  // Event end-time overrides (keyed by lowercased event name). Edit here to change defaults.
  var EVENT_END_OVERRIDES = {
    'regular fellowship': '10:00PM'
  };
  document.querySelectorAll('.calendar-button').forEach(function(button){
    var row = button.closest('tr');
    if (!row) return;

    var cells = row.querySelectorAll('td');
    if (cells.length < 6) return;

    var dateText = cells[1].textContent.trim();
    var timeText = cells[2].textContent.trim();
    var locationText = cells[3].textContent.trim();
    var eventText = cells[4].textContent.trim();
    var detailsText = cells[5].textContent.trim();

    var startDate = parseScheduleDate(dateText, timeText);
    if (!startDate) return;

    // Determine end time: per-row `data-end-time` -> EVENT_END_OVERRIDES[event] -> default 90 minutes
    var endDate = null;
    var rowEndTime = row.dataset && row.dataset.endTime ? row.dataset.endTime.trim() : null;
    var mappedEnd = EVENT_END_OVERRIDES[eventText.trim().toLowerCase()];
    var endTimeToUse = rowEndTime || mappedEnd || null;
    if (endTimeToUse) {
      var timeMatch2 = endTimeToUse.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (timeMatch2) {
        var hh = parseInt(timeMatch2[1], 10);
        var mm = timeMatch2[2] ? parseInt(timeMatch2[2], 10) : 0;
        var pp = timeMatch2[3].toUpperCase();
        if (pp === 'PM' && hh < 12) hh += 12;
        if (pp === 'AM' && hh === 12) hh = 0;
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), hh, mm);
        if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
      }
    }
    if (!endDate) {
      endDate = new Date(startDate.getTime() + 90 * 60000);
    }

    var title, description;
    var weekText = cells[0].textContent.trim();
    if (eventText.trim().toLowerCase() === 'regular fellowship') {
      title = 'CGF Weekly Gathering';
      description = weekText + '\nTopic: ' + detailsText + '\nLocation: ' + locationText;
    } else {
      title = eventText + ' — ' + detailsText;
      description = weekText + '\n' + detailsText + ' at ' + locationText;
    }
    var dates = formatGoogleCalendarDate(startDate) + '/' + formatGoogleCalendarDate(endDate);
    var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(title)
      + '&dates=' + encodeURIComponent(dates)
      + '&details=' + encodeURIComponent(description)
      + '&location=' + encodeURIComponent(locationText)
      + '&trp=false';

    button.href = url;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
  });

  function parseScheduleDate(dateText, timeText) {
    var months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    var parts = dateText.split(' ');
    if (parts.length !== 2) return null;

    var month = months[parts[0]];
    var day = parseInt(parts[1], 10);
    if (isNaN(month) || isNaN(day)) return null;

    var timeMatch = timeText.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (!timeMatch) return null;

    var hour = parseInt(timeMatch[1], 10);
    var minute = parseInt(timeMatch[2], 10);
    var period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    var year = new Date().getFullYear();
    var date = new Date(year, month, day, hour, minute);
    return date;
  }

  function formatGoogleCalendarDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // Scroll-driven hero: collapses the side gutters, wipes the headline, and crossfades the frames.
  (function(){
    var hero = document.querySelector('[data-hero]');
    var header = document.querySelector('header');
    var heroMedia = hero ? hero.querySelector('.hero__media') : null;
    if (!hero) return;

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero__slide'));
    var blackCopy = hero.querySelector('.hero__copy--black');
    var whiteCopy = hero.querySelector('.hero__copy--white');
    if (!slides.length || !blackCopy || !whiteCopy) return;

    var heroScrollLength = 0;
    var scheduled = false;
    var lastScrollY = window.scrollY;
    var solidEnteredAt = null;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function measure() {
      hero.style.height = Math.round(window.innerHeight * (slides.length + 0.35)) + 'px';
      heroScrollLength = Math.max(1, hero.offsetHeight - window.innerHeight);
    }

    function update() {
      scheduled = false;

      var progress = clamp(window.scrollY / heroScrollLength, 0, 1);
      var gutterProgress = clamp(progress / 0.28, 0, 1);
      var revealProgress = clamp(progress / 0.34, 0, 1);
      var mediaHeight = Math.round(window.innerHeight * (0.15 + (0.85 * revealProgress)));
      var textCutoff = Math.max(0, window.innerHeight - mediaHeight);
      var sequenceStart = 0.36;
      var sequenceEnd = 0.74;
      var transitionShare = 0.18;
      var transitionCount = slides.length - 1;

      hero.style.setProperty('--hero-side-gap', Math.round(24 * (1 - gutterProgress)) + 'px');
      hero.style.setProperty('--hero-media-height', mediaHeight + 'px');
      hero.style.setProperty('--hero-text-cutoff', textCutoff + 'px');
      blackCopy.style.opacity = '1';
      whiteCopy.style.opacity = '1';

      for (var j = 0; j < slides.length; j += 1) {
        slides[j].style.opacity = '0';
      }

      if (progress <= sequenceStart) {
        slides[0].style.opacity = '1';
      } else if (progress >= sequenceEnd) {
        slides[slides.length - 1].style.opacity = '1';
      } else {
        var spanProgress = (progress - sequenceStart) / (sequenceEnd - sequenceStart);
        var transitionProgress = spanProgress * transitionCount;
        var transitionIndex = Math.floor(transitionProgress);
        var segmentProgress = transitionProgress - transitionIndex;
        var holdThreshold = 1 - transitionShare;

        transitionIndex = Math.min(transitionIndex, slides.length - 2);

        if (segmentProgress < holdThreshold) {
          slides[transitionIndex].style.opacity = '1';
        } else {
          var fadeProgress = (segmentProgress - holdThreshold) / transitionShare;
          slides[transitionIndex].style.opacity = String(1 - fadeProgress);
          slides[transitionIndex + 1].style.opacity = String(fadeProgress);
        }
      }

      if (header && heroMedia) {
        var headerRect = header.getBoundingClientRect();
        var mediaRect = heroMedia.getBoundingClientRect();
        var heroRect = hero.getBoundingClientRect();
        var overlap = mediaRect.top < headerRect.bottom && mediaRect.bottom > headerRect.top;
        var currentScrollY = window.scrollY;
        var scrollDelta = currentScrollY - lastScrollY;
        var solidThreshold = 12;
        var pastHero = heroRect.bottom <= solidThreshold;

        header.classList.toggle('header--on-image', overlap);
        header.classList.toggle('header--solid', pastHero);

        if (pastHero) {
          if (solidEnteredAt === null) {
            solidEnteredAt = currentScrollY;
          }

          if (scrollDelta > 2 && currentScrollY - solidEnteredAt > 42) {
            header.classList.add('header--hidden');
          } else if (scrollDelta < -2) {
            header.classList.remove('header--hidden');
          }
        } else {
          solidEnteredAt = null;
          header.classList.remove('header--hidden');
        }

        lastScrollY = currentScrollY;
      }
    }

    function requestUpdate() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    }

    measure();
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function() {
      measure();
      requestUpdate();
    });
  })();

  // Location carousel: rotate images with fade effect
  (function(){
    document.querySelectorAll('.location-image-carousel').forEach(function(carousel){
      var images = carousel.querySelectorAll('.carousel-image');
      if (images.length <= 1) return;
      var currentIndex = 0;
      setInterval(function(){
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
      }, 6000);
    });
  })();

  // Note: removed single-file .ics generation and Add All button per user request.

})();
