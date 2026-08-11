/* Handles rendering of individual article pages based on URL parameter id. */
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

  function getQueryParam(param) {
    var search = window.location.search.substring(1);
    var vars = search.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) === param) {
        return decodeURIComponent(pair[1] || '');
      }
    }
    return null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('article-detail-container');
    if (!container) return;

    var articleId = getQueryParam('id');
    var articles = (typeof ZO_ARTICLES !== 'undefined' && Array.isArray(ZO_ARTICLES)) ? ZO_ARTICLES : [];

    var article = null;
    if (articleId) {
      article = articles.find(function (a) { return a.id === articleId; });
    }
    
    // Fallback to first article if id is missing or invalid
    if (!article && articles.length > 0) {
      article = articles[0];
    }

    if (!article) {
      container.innerHTML = '<h2>Article Not Found</h2><p>Sorry, the article you requested could not be found.</p><a class="btn" href="articles.html">Return to Articles</a>';
      return;
    }

    document.title = article.title + ' — Zo Scholars Journal Club';

    var html = '';

    // Label Pill
    if (article.label) {
      html += '<span class="pill" style="margin-bottom: 12px; display: inline-block;">' + article.label + '</span>';
    }

    var date = parseDate(article.date);
    var formattedDate = date
      ? date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear()
      : '';

    html += '<h1 style="font-size: 2rem; color: var(--blue-900); margin: 0 0 12px; line-height: 1.25;">' + article.title + '</h1>';
    
    if (article.author) {
      html += '<p style="color: var(--blue-700); font-weight: 500; font-size: 1.05rem; margin: 0 0 8px;">By ' + article.author + '</p>';
    }

    if (formattedDate) {
      html += '<p style="color: var(--ink-soft); font-size: 0.9rem; margin: 0 0 24px; border-bottom: 1px solid var(--line); padding-bottom: 16px;">' + formattedDate + '</p>';
    } else {
      html += '<div style="border-bottom: 1px solid var(--line); margin-bottom: 24px;"></div>';
    }

    // PDF Article
    if (article.pdfUrl) {
      if (Array.isArray(article.content) && article.content.length > 0) {
        html += '<div style="font-size: 1.05rem; line-height: 1.7; margin-bottom: 24px; background: var(--blue-050); padding: 18px 20px; border-radius: var(--radius); border-left: 4px solid var(--blue-500);">';
        article.content.forEach(function (para) {
          html += '<p style="margin: 0 0 10px;">' + para + '</p>';
        });
        html += '</div>';
      }

      html += '<div style="margin: 24px 0;">';
      html += '  <a class="btn" href="' + article.pdfUrl + '" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; font-size: 1rem; padding: 12px 24px;">';
      html += '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
      html += '    Open PDF in new tab';
      html += '  </a>';
      html += '</div>';

      html += '<div style="margin-top: 30px; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden;">';
      html += '  <iframe src="' + article.pdfUrl + '" style="width: 100%; height: 750px; border: none;"></iframe>';
      html += '</div>';
    } else if (Array.isArray(article.content)) {
      // Standard Text Article
      html += '<div style="font-size: 1.05rem; line-height: 1.8; color: var(--ink);">';
      article.content.forEach(function (para) {
        html += '<p style="margin-bottom: 1.4em;">' + para + '</p>';
      });
      html += '</div>';
    } else if (article.videoUrl) {
      // Video Article
      html += '<div style="margin: 20px 0;">';
      html += '  <a class="btn" href="' + article.videoUrl + '" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>';
      html += '</div>';
    }

    container.innerHTML = html;
  });
})();
