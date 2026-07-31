/* Zo Scholars Journal Club — mailing list registration + member directory.
 *
 * Two modes, decided automatically at load:
 *
 *  1. Local server mode — `python3 server.py` is running. Registrations are
 *     POSTed to the server, which appends them to registrations.xlsx on disk
 *     and updates data/members.json.
 *
 *  2. Static mode — the site is served from GitHub Pages (or opened directly).
 *     There is no server to write files, so registrations are kept in this
 *     browser's localStorage and can be exported to .xlsx on demand.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'zo-scholars-mailing-list';
  var FIELDS = ['name', 'email', 'institute', 'subject', 'designation'];

  var serverMode = false;

  /* ---------- storage helpers ---------- */

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- rendering ---------- */

  function text(value) {
    return (value == null ? '' : String(value)).trim();
  }

  function renderMembers(list) {
    var tbody = document.getElementById('members-body');
    var tally = document.getElementById('members-tally');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!list.length) {
      var tr = document.createElement('tr');
      tr.className = 'empty-row';
      var td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'No one has joined yet — be the first to sign up above.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      list.forEach(function (m) {
        var tr = document.createElement('tr');
        [m.institute, m.subject, m.designation].forEach(function (value) {
          var td = document.createElement('td');
          td.textContent = text(value) || '—';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    if (tally) {
      var institutes = {};
      var subjects = {};
      list.forEach(function (m) {
        if (text(m.institute)) institutes[text(m.institute).toLowerCase()] = 1;
        if (text(m.subject)) subjects[text(m.subject).toLowerCase()] = 1;
      });
      tally.innerHTML = '';
      [
        list.length + (list.length === 1 ? ' member' : ' members'),
        Object.keys(institutes).length + ' institutes',
        Object.keys(subjects).length + ' subjects'
      ].forEach(function (label) {
        var span = document.createElement('span');
        span.className = 'pill';
        span.textContent = label;
        tally.appendChild(span);
      });
    }
  }

  /* Public directory = entries published in data/members.json (committed by the
     organisers) merged with anything this browser has registered locally. */
  function loadMembers() {
    var local = readLocal();

    var endpoint = serverMode ? 'api/members' : 'data/members.json';

    return fetch(endpoint, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (published) {
        if (!Array.isArray(published)) published = [];
        if (serverMode) return published;

        var seen = {};
        published.forEach(function (m) {
          seen[(text(m.institute) + '|' + text(m.subject) + '|' + text(m.designation)).toLowerCase()] = 1;
        });
        local.forEach(function (m) {
          var key = (text(m.institute) + '|' + text(m.subject) + '|' + text(m.designation)).toLowerCase();
          if (!seen[key]) {
            seen[key] = 1;
            published.push(m);
          }
        });
        return published;
      })
      .then(function (list) {
        renderMembers(list);
        return list;
      });
  }

  /* ---------- form ---------- */

  function setMessage(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function initForm() {
    var form = document.getElementById('join-form');
    if (!form) return;

    var msg = document.getElementById('form-msg');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var record = { registered: new Date().toISOString().slice(0, 16).replace('T', ' ') };
      var missing = [];

      FIELDS.forEach(function (field) {
        var input = form.elements[field];
        var value = text(input && input.value);
        record[field] = value;
        if (!value) missing.push(field);
      });

      if (missing.length) {
        setMessage(msg, 'Please fill in every field before submitting.', 'err');
        var first = form.elements[missing[0]];
        if (first) first.focus();
        return;
      }

      if (!validEmail(record.email)) {
        setMessage(msg, 'That email address does not look right — please check it.', 'err');
        form.elements.email.focus();
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      setMessage(msg, 'Saving…', '');

      var done = function (message, kind) {
        if (button) button.disabled = false;
        setMessage(msg, message, kind);
      };

      if (serverMode) {
        fetch('api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        })
          .then(function (r) {
            if (!r.ok) throw new Error('server rejected the registration');
            return r.json();
          })
          .then(function () {
            form.reset();
            done('Thank you — you have been added to the mailing list.', 'ok');
            loadMembers();
          })
          .catch(function () {
            done('Could not reach the server. Please try again.', 'err');
          });
        return;
      }

      var list = readLocal();
      var duplicate = list.some(function (m) {
        return text(m.email).toLowerCase() === record.email.toLowerCase();
      });

      if (duplicate) {
        done('That email address is already on the list.', 'err');
        return;
      }

      list.push(record);

      if (!writeLocal(list)) {
        done('This browser would not let us save the entry. Try turning off private browsing.', 'err');
        return;
      }

      form.reset();
      done('Thank you — you have been added to the mailing list.', 'ok');
      loadMembers();
    });
  }

  /* ---------- excel export ---------- */

  function initExport() {
    var button = document.getElementById('export-btn');
    if (!button) return;

    button.addEventListener('click', function () {
      if (serverMode) {
        window.location.href = 'api/export';
        return;
      }

      var list = readLocal();
      if (!list.length) {
        setMessage(document.getElementById('export-msg'),
          'There is nothing saved in this browser yet.', 'err');
        return;
      }

      var blob = ZoXlsx.build({
        sheetName: 'Mailing List',
        columns: [
          { header: 'Name', width: 24 },
          { header: 'Email', width: 30 },
          { header: 'Institute', width: 34 },
          { header: 'Subject', width: 26 },
          { header: 'Designation', width: 24 },
          { header: 'Registered', width: 20 }
        ],
        rows: list.map(function (m) {
          return [m.name, m.email, m.institute, m.subject, m.designation, m.registered];
        })
      });

      ZoXlsx.download(blob, 'zo-scholars-mailing-list.xlsx');
      setMessage(document.getElementById('export-msg'),
        'Downloaded ' + list.length + ' ' + (list.length === 1 ? 'entry' : 'entries') + '.', 'ok');
    });
  }

  /* ---------- boot ---------- */

  function start() {
    initForm();
    initExport();
    loadMembers();

    var note = document.getElementById('storage-note');
    if (note && serverMode) {
      note.textContent = 'Local server detected — registrations are being written straight to registrations.xlsx.';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch('api/ping', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { serverMode = !!(data && data.ok); })
      .catch(function () { serverMode = false; })
      .then(start);
  });
})();
