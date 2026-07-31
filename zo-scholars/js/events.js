/* Renders the events written in events-data.js onto the events page. */
(function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
              'Thursday', 'Friday', 'Saturday'];

  function parseDate(value) {
    var parts = String(value || '').split('-');
    if (parts.length !== 3) return null;
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function buildEvent(item, date, isPast) {
    var article = document.createElement('article');
    article.className = 'event' + (isPast ? ' past' : '');

    var when = document.createElement('div');
    when.className = 'when';
    when.textContent = date
      ? date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear()
      : 'Date to be confirmed';

    if (date || item.time) {
      var time = document.createElement('span');
      time.className = 'time';
      time.textContent = [date ? DAYS[date.getDay()] : '', item.time || '']
        .filter(Boolean).join(' · ');
      when.appendChild(time);
    }

    var body = document.createElement('div');

    var title = document.createElement('h3');
    title.textContent = item.title || 'Untitled session';
    body.appendChild(title);

    var metaBits = [];
    if (item.speaker) metaBits.push(item.speaker);
    if (item.venue) metaBits.push(item.venue);
    if (metaBits.length) {
      var meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = metaBits.join('  ·  ');
      body.appendChild(meta);
    }

    if (item.description) {
      var desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = item.description;
      body.appendChild(desc);
    }

    if (item.link) {
      var actions = document.createElement('p');
      actions.style.margin = '16px 0 0';
      var a = document.createElement('a');
      a.className = 'btn btn-quiet';
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = isPast ? 'View material' : 'Join this session';
      actions.appendChild(a);
      body.appendChild(actions);
    }

    article.appendChild(when);
    article.appendChild(body);
    return article;
  }

  function emptyNote(message) {
    var p = document.createElement('p');
    p.className = 'section-note';
    p.style.margin = '0';
    p.textContent = message;
    return p;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var upcomingEl = document.getElementById('upcoming-list');
    var pastEl = document.getElementById('past-list');
    var pastSection = document.getElementById('past-section');
    if (!upcomingEl) return;

    var events = (typeof ZO_EVENTS !== 'undefined' && Array.isArray(ZO_EVENTS)) ? ZO_EVENTS : [];

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = [];
    var past = [];

    events.forEach(function (item) {
      var date = parseDate(item.date);
      if (date && date < today) past.push({ item: item, date: date });
      else upcoming.push({ item: item, date: date });
    });

    upcoming.sort(function (a, b) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date - b.date;
    });
    past.sort(function (a, b) { return b.date - a.date; });

    if (!upcoming.length) {
      upcomingEl.appendChild(emptyNote('No sessions are scheduled right now. Join the mailing list and you will hear about the next one first.'));
    } else {
      upcoming.forEach(function (entry) {
        upcomingEl.appendChild(buildEvent(entry.item, entry.date, false));
      });
    }

    if (past.length && pastEl) {
      past.forEach(function (entry) {
        pastEl.appendChild(buildEvent(entry.item, entry.date, true));
      });
    } else if (pastSection) {
      pastSection.style.display = 'none';
    }
  });
})();
