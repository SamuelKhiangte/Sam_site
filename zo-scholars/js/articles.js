/* Renders the articles written in articles-data.js onto the articles page. */
(function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseDate(value) {
    var parts = String(value || '').split('-');
    if (parts.length !== 3) return null;
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function buildArticle(item, date) {
    var article = document.createElement('article');
    article.className = 'event';

    var side = document.createElement('div');
    side.className = 'when';
    
    if (item.label) {
      var labelSpan = document.createElement('span');
      labelSpan.className = 'pill';
      labelSpan.style.display = 'inline-block';
      labelSpan.style.marginBottom = '8px';
      labelSpan.textContent = item.label;
      side.appendChild(labelSpan);
    }

    var dateText = document.createElement('div');
    dateText.style.fontSize = '0.88rem';
    dateText.style.color = 'var(--ink-soft)';
    dateText.textContent = date
      ? date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear()
      : 'Date to be confirmed';
    side.appendChild(dateText);

    var body = document.createElement('div');

    var title = document.createElement('h3');
    title.style.fontSize = '1.25rem';
    title.style.marginBottom = '6px';
    if (item.videoUrl) {
      var titleLink = document.createElement('a');
      titleLink.href = item.videoUrl;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.textContent = item.title || 'Untitled';
      title.appendChild(titleLink);
    } else {
      title.textContent = item.title || 'Untitled';
    }
    body.appendChild(title);

    if (item.author) {
      var author = document.createElement('p');
      author.className = 'meta';
      author.textContent = 'By ' + item.author;
      body.appendChild(author);
    }

    if (item.videoUrl) {
      var videoLink = document.createElement('a');
      videoLink.href = item.videoUrl;
      videoLink.target = '_blank';
      videoLink.rel = 'noopener noreferrer';
      videoLink.className = 'video-preview';
      
      var videoId = '';
      if (item.videoUrl.indexOf('youtu.be/') > -1) {
        videoId = item.videoUrl.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (item.videoUrl.indexOf('v=') > -1) {
        videoId = item.videoUrl.split('v=')[1].split('&')[0];
      }
      
      if (videoId) {
        var img = document.createElement('img');
        img.src = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
        img.onerror = function() {
          this.onerror = null;
          this.src = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
        };
        img.alt = item.title || 'Video Thumbnail';
        videoLink.appendChild(img);
        
        var playBtn = document.createElement('div');
        playBtn.className = 'video-play-btn';
        videoLink.appendChild(playBtn);
        
        body.appendChild(videoLink);
      }
    }

    if (Array.isArray(item.content)) {
      item.content.forEach(function (para) {
        var p = document.createElement('p');
        p.className = 'desc';
        p.style.marginBottom = '1.2em';
        p.innerHTML = para;
        body.appendChild(p);
      });
    }

    article.appendChild(side);
    article.appendChild(body);
    return article;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var listEl = document.getElementById('articles-list');
    if (!listEl) return;

    var articles = (typeof ZO_ARTICLES !== 'undefined' && Array.isArray(ZO_ARTICLES)) ? ZO_ARTICLES : [];

    var parsed = [];
    articles.forEach(function (item) {
      var date = parseDate(item.date);
      parsed.push({ item: item, date: date });
    });

    parsed.sort(function (a, b) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date - a.date;
    });

    if (!parsed.length) {
      var p = document.createElement('p');
      p.className = 'section-note';
      p.textContent = 'No articles have been shared yet.';
      listEl.appendChild(p);
    } else {
      parsed.forEach(function (entry) {
        listEl.appendChild(buildArticle(entry.item, entry.date));
      });
    }
  });
})();
