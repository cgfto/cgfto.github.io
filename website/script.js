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

  // Smoothly adjust hero bleed based on scroll position so the top and sides
  // transition back into the page padding over the first 120px of scroll.
  // Also handle parallax hero effect: image carousel, text layering, and margin collapse.
  (function(){
    var hero = document.querySelector('.hero');
    var carousel = document.querySelector('.hero__carousel');
    var images = document.querySelectorAll('.hero__image');
    var blackText = document.querySelector('.hero__text--black');
    var whiteText = document.querySelector('.hero__text--white');
    
    if (!hero || images.length === 0) return;
    
    // Activate first image on load
    images[0].classList.add('active');
    
    var lastBleed = null;
    var maxBleed = 24;
    var bleedRange = 120;
    var heroHeight = hero.offsetHeight;
    var imageCount = images.length;

    function updateHeroState(){
      var scroll = window.scrollY;
      var heroScroll = Math.max(0, Math.min(1, scroll / heroHeight));
      
      // Update hero bleed (margins collapse over first 120px)
      var bleedScroll = Math.max(0, Math.min(1, scroll / bleedRange));
      var bleed = Math.round((1 - bleedScroll) * maxBleed);
      if (bleed !== lastBleed) {
        document.body.style.setProperty('--hero-bleed', bleed + 'px');
        lastBleed = bleed;
      }
      
      // Update hero scroll CSS variable for potential use
      document.body.style.setProperty('--hero-scroll', heroScroll);
      
      // Image carousel: switch images based on scroll depth through hero
      if (imageCount > 1) {
        var imageIndex = Math.floor(heroScroll * (imageCount - 1));
        imageIndex = Math.min(imageIndex, imageCount - 1);
        
        images.forEach(function(img, idx) {
          if (idx === imageIndex) {
            img.classList.add('active');
          } else {
            img.classList.remove('active');
          }
        });
      }
      
      // Parallax text effect: black text fades out, white text fades in
      // Black text opacity: 1 at top, fades to 0 as you scroll through hero
      var textScroll = Math.max(0, Math.min(1, scroll / (heroHeight * 0.8)));
      if (blackText) {
        blackText.style.opacity = Math.max(0, 1 - textScroll);
      }
      if (whiteText) {
        whiteText.style.opacity = Math.min(1, textScroll);
      }
    }

    updateHeroState();
    window.addEventListener('scroll', function(){
      window.requestAnimationFrame(updateHeroState);
    }, {passive:true});
    window.addEventListener('resize', function(){
      heroHeight = hero.offsetHeight;
      updateHeroState();
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
