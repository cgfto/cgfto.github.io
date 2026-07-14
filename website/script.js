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
    var whiteGhostActions = whiteCopy ? whiteCopy.querySelector('.hero__actions') : null;
    if (!slides.length || !blackCopy || !whiteCopy) return;

    var heroScrollLength = 0;
    var scheduled = false;
    var lastScrollY = window.scrollY;
    var switchPassed = false;
    var navHidden = false;
    var scrollIntent = 0;

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
      var revealProgress = clamp(progress / 0.34, 0, 1);
      var mediaRect = heroMedia.getBoundingClientRect();
      var outroStartPx = 560;
      var outroEndPx = 220;
      var outroProgress = clamp((outroStartPx - mediaRect.bottom) / (outroStartPx - outroEndPx), 0, 1);
      var mediaHeight = Math.round(window.innerHeight * (0.15 + (0.85 * revealProgress)));
      var textCutoff = Math.max(0, window.innerHeight - mediaHeight);
      var sequenceStart = 0.36;
      var sequenceEnd = 0.86;
      var transitionShare = 0.18;
      var transitionCount = slides.length - 1;
      var sideGap = Math.round(24 * (outroProgress > 0 ? outroProgress : (1 - revealProgress)));
      var topRadius = Math.round(8 * (outroProgress > 0 ? outroProgress : (1 - revealProgress)));
      var bottomRadius = Math.round(8 * outroProgress);
      var slideParallaxY = (0.5 - progress) * 56;
      var centerShiftProgress = clamp((revealProgress - 0.58) / 0.42, 0, 1);
      var whiteCenterShift = 0;

      if (whiteGhostActions) {
        var ghostActionsStyle = window.getComputedStyle(whiteGhostActions);
        var ghostActionsMarginTop = parseFloat(ghostActionsStyle.marginTop) || 0;
        whiteCenterShift = ((whiteGhostActions.offsetHeight + ghostActionsMarginTop) / 2) * centerShiftProgress;
      }

      hero.style.setProperty('--hero-side-gap', sideGap + 'px');
      hero.style.setProperty('--hero-media-height', mediaHeight + 'px');
      hero.style.setProperty('--hero-text-cutoff', textCutoff + 'px');
      hero.style.setProperty('--hero-radius-top', topRadius + 'px');
      hero.style.setProperty('--hero-radius-bottom', bottomRadius + 'px');
      hero.style.setProperty('--hero-white-center-shift', whiteCenterShift.toFixed(2) + 'px');
      hero.style.setProperty('--hero-slide-parallax', slideParallaxY.toFixed(2) + 'px');
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
        var overlapBandBottom = 96;
        var overlap = mediaRect.top < overlapBandBottom && mediaRect.bottom > 0;
        var currentScrollY = window.scrollY;
        var scrollDelta = currentScrollY - lastScrollY;
        var enterSwitchProgress = 0.91;
        var exitSwitchProgress = 0.86;
        var atSwitch = switchPassed ? progress >= exitSwitchProgress : progress >= enterSwitchProgress;

        switchPassed = atSwitch;

        header.classList.toggle('header--solid', switchPassed);
        header.classList.toggle('header--on-image', overlap && !switchPassed);
        header.classList.remove('header--returning-top');

        if (switchPassed) {
          // Hide immediately on any scroll down
          if (scrollDelta > 0) {
            navHidden = true;
          } else if (scrollDelta < 0) {
            scrollIntent = Math.min(0, scrollIntent) + scrollDelta;
            if (scrollIntent < -8) {
              navHidden = false;
              scrollIntent = 0;
            }
          }
        } else {
          navHidden = false;
          scrollIntent = 0;
        }

        header.classList.toggle('header--hidden', navHidden);
        header.classList.remove('header--pre-exit');

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

  // Ministries carousel: auto-scroll with hover/drag controls
  (function(){
    var carousel = document.querySelector('[data-carousel="ministries"]');
    if (!carousel) return;

    var normalSpeed = 1.5; // pixels per frame at normal pace
    var hoverSpeed = 0.4; // pixels per frame when hovering (75% slower)
    var currentSpeed = normalSpeed;
    var isManualDragging = false;
    var dragStartX = 0;
    var dragStartScrollLeft = 0;
    var halfScrollWidth = 0;
    var hasCloned = false;

    // Prevent default drag behavior on images
    carousel.addEventListener('dragstart', function(e){
      e.preventDefault();
    }, false);

    function setupCarousel(){
      if (hasCloned) return;
      
      var cards = Array.prototype.slice.call(carousel.querySelectorAll('.ministry-carousel-card:not(.cloned)'));
      console.log('Setting up carousel with', cards.length, 'cards');
      if (cards.length === 0) return;
      
      // Get initial scroll width before cloning
      halfScrollWidth = carousel.scrollWidth;
      console.log('Half scroll width:', halfScrollWidth);
      
      // Clone all cards
      cards.forEach(function(card){
        var clone = card.cloneNode(true);
        clone.classList.add('cloned');
        carousel.appendChild(clone);
      });
      
      console.log('Total scroll width after cloning:', carousel.scrollWidth);
      hasCloned = true;
    }

    // Initialize carousel cloning immediately on page load
    window.addEventListener('load', function(){
      setupCarousel();
    }, false);

    // Also try immediately in case load already fired
    if (document.readyState === 'complete') {
      setupCarousel();
    }

    // Main auto-scroll loop
    function autoScroll(){
      if (!isManualDragging && halfScrollWidth > 0) {
        carousel.scrollLeft += currentSpeed;
        
        // Loop back when reaching the cloned section
        if (carousel.scrollLeft >= halfScrollWidth) {
          carousel.scrollLeft = 0;
        }
      }
      requestAnimationFrame(autoScroll);
    }

    // Start scrolling
    autoScroll();

    // Hover to slow down
    carousel.addEventListener('mouseenter', function(){
      currentSpeed = hoverSpeed;
    }, false);

    carousel.addEventListener('mouseleave', function(){
      currentSpeed = normalSpeed;
      isManualDragging = false;
    }, false);

    // Manual drag/click scrolling
    carousel.addEventListener('mousedown', function(e){
      e.preventDefault();
      isManualDragging = true;
      dragStartX = e.pageX;
      dragStartScrollLeft = carousel.scrollLeft;
    }, false);

    document.addEventListener('mousemove', function(e){
      if (!isManualDragging) return;
      var dragDistance = e.pageX - dragStartX;
      carousel.scrollLeft = dragStartScrollLeft - dragDistance;
    }, false);

    document.addEventListener('mouseup', function(){
      isManualDragging = false;
    }, false);
  })();

  // FAQ Accordion functionality
  (function(){
    var faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(function(question){
      question.addEventListener('click', function(){
        var answerId = this.getAttribute('aria-controls');
        var answer = document.getElementById(answerId);
        var isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        // Close all other answers
        faqQuestions.forEach(function(q){
          if(q !== question) {
            q.setAttribute('aria-expanded', 'false');
            var otherId = q.getAttribute('aria-controls');
            var otherAnswer = document.getElementById(otherId);
            if(otherAnswer) {
              otherAnswer.hidden = true;
            }
          }
        });
        
        // Toggle current answer
        this.setAttribute('aria-expanded', !isExpanded);
        answer.hidden = isExpanded;
      });
    });
  })();

  // Note: removed single-file .ics generation and Add All button per user request.

})();
