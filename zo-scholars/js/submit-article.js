/* Zo Scholars Journal Club — Article Submission & File Upload Handler.
 * Sends submissions and attachments to samuelzkh@gmail.com.
 */
(function () {
  'use strict';

  var TARGET_EMAIL = 'samuelzkh@gmail.com';
  var FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/' + TARGET_EMAIL;
  var serverMode = false;

  function text(val) {
    return (val == null ? '' : String(val)).trim();
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function initSubmitForm(form) {
    if (!form) return;

    var msg = form.querySelector('.submit-msg') || document.getElementById('submit-msg');
    var fileInput = form.querySelector('input[type="file"]');
    var fileInfo = form.querySelector('.file-selected-info');
    var fileNameSpan = form.querySelector('.file-name-text');
    var removeFileBtn = form.querySelector('.remove-file-btn');
    var uploadBox = form.querySelector('.file-upload-box');
    var submitBtn = form.querySelector('button[type="submit"]');

    function setMessage(message, kind) {
      if (!msg) return;
      msg.innerHTML = message;
      msg.className = 'form-msg' + (kind ? ' ' + kind : '');
    }

    // Handle File Pick & Drag/Drop Display
    if (fileInput && uploadBox) {
      ['dragenter', 'dragover'].forEach(function (eventName) {
        uploadBox.addEventListener(eventName, function (e) {
          e.preventDefault();
          e.stopPropagation();
          uploadBox.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(function (eventName) {
        uploadBox.addEventListener(eventName, function (e) {
          e.preventDefault();
          e.stopPropagation();
          uploadBox.classList.remove('drag-over');
        });
      });

      uploadBox.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          updateFileDisplay();
        }
      });

      fileInput.addEventListener('change', updateFileDisplay);

      if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function (e) {
          e.preventDefault();
          fileInput.value = '';
          updateFileDisplay();
        });
      }
    }

    function updateFileDisplay() {
      if (!fileInfo || !fileNameSpan) return;
      if (fileInput.files && fileInput.files.length > 0) {
        var file = fileInput.files[0];
        fileNameSpan.textContent = file.name + ' (' + formatBytes(file.size) + ')';
        fileInfo.style.display = 'flex';
        if (uploadBox) uploadBox.classList.add('has-file');
      } else {
        fileNameSpan.textContent = '';
        fileInfo.style.display = 'none';
        if (uploadBox) uploadBox.classList.remove('has-file');
      }
    }

    // Form Submission
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var author = text(form.elements.author_name ? form.elements.author_name.value : '');
      var email = text(form.elements.author_email ? form.elements.author_email.value : '');
      var institute = text(form.elements.author_institute ? form.elements.author_institute.value : '');
      var title = text(form.elements.article_title ? form.elements.article_title.value : '');
      var category = text(form.elements.article_category ? form.elements.article_category.value : '');
      var summary = text(form.elements.article_summary ? form.elements.article_summary.value : '');
      var content = text(form.elements.article_content ? form.elements.article_content.value : '');
      var link = text(form.elements.article_link ? form.elements.article_link.value : '');
      var hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

      if (!author) {
        setMessage('Please enter your name.', 'err');
        if (form.elements.author_name) form.elements.author_name.focus();
        return;
      }

      if (!email || !validEmail(email)) {
        setMessage('Please provide a valid email address so we can contact you.', 'err');
        if (form.elements.author_email) form.elements.author_email.focus();
        return;
      }

      if (!title) {
        setMessage('Please enter a title for your article or submission.', 'err');
        if (form.elements.article_title) form.elements.article_title.focus();
        return;
      }

      if (!hasFile && !content && !link && !summary) {
        setMessage('Please provide your article text, attach a document/PDF, or include a link.', 'err');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('data-original-text', submitBtn.textContent);
        submitBtn.textContent = 'Submitting article…';
      }
      setMessage('Submitting your article to the editorial team…', '');

      var formData = new FormData();
      formData.append('Author Name', author);
      formData.append('Author Email', email);
      formData.append('Institute / Organization', institute || 'Not specified');
      formData.append('Article Title', title);
      formData.append('Category', category || 'General Article');
      formData.append('Abstract / Summary', summary || 'None');
      formData.append('Article Text / Content', content || 'Provided via attachment or link');
      formData.append('External Link / Video URL', link || 'None');
      formData.append('Submitted At', new Date().toLocaleString());

      // FormSubmit special controls
      formData.append('_subject', 'Zo Scholars Article Submission: ' + title + ' (by ' + author + ')');
      formData.append('_replyto', email);
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');

      if (hasFile) {
        formData.append('attachment', fileInput.files[0]);
      }

      function done(isSuccess, feedbackText) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.getAttribute('data-original-text') || 'Submit Article';
        }
        setMessage(feedbackText, isSuccess ? 'ok' : 'err');
        if (isSuccess) {
          form.reset();
          updateFileDisplay();
        }
      }

      var endpoint = serverMode ? 'api/submit-article' : FORMSUBMIT_ENDPOINT;

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error('Server returned error status ' + res.status);
          }
          return res.json().catch(function () { return { success: true }; });
        })
        .then(function () {
          done(true, '🎉 <strong>Thank you!</strong> Your article <em>"' + title + '"</em> has been submitted to Samuel Z. Khiangte (' + TARGET_EMAIL + '). We will review it and publish it to the website soon.');
        })
        .catch(function (err) {
          console.warn('FormSubmit AJAX issue:', err);
          var mailtoSubject = encodeURIComponent('Zo Scholars Article Submission: ' + title);
          var mailtoBody = encodeURIComponent('Author: ' + author + '\nEmail: ' + email + '\nInstitute: ' + institute + '\nTitle: ' + title + '\n\nSummary:\n' + summary + '\n\nContent:\n' + content + '\n\nLink: ' + link);
          done(false, 'Could not send automatically via network. Please <a href="mailto:' + TARGET_EMAIL + '?subject=' + mailtoSubject + '&body=' + mailtoBody + '" style="text-decoration:underline; font-weight:600; color:inherit;">click here to email your submission directly to ' + TARGET_EMAIL + '</a>.');
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch('api/ping', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { serverMode = !!(data && data.ok); })
      .catch(function () { serverMode = false; })
      .then(function () {
        var forms = document.querySelectorAll('.article-submission-form, #article-submission-form');
        forms.forEach(initSubmitForm);
      });
  });
})();
