/* Prime Build project inquiry: progressive client-side validation.
   The HTML form submits normally to FormSubmit so delivery still works without JS. */
(() => {
  'use strict';
  const form = document.getElementById('project-inquiry-form');
  if (!form) return;

  const fileInput = document.getElementById('inquiry-attachment');
  const fileStatus = document.getElementById('inquiry-file-status');
  const contactPreference = document.getElementById('inquiry-contact-method');
  const phoneInput = document.getElementById('inquiry-phone');
  const phoneLabelOptional = document.querySelector('label[for="inquiry-phone"] .optional');
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const VALID_EXTENSIONS = /\.(pdf|png|jpe?g)$/i;

  function checkAttachment() {
    if (!fileInput || !fileStatus) return true;
    const selected = fileInput.files && fileInput.files[0];
    fileInput.setCustomValidity('');
    if (!selected) {
      fileStatus.textContent = '';
      fileStatus.classList.remove('error');
      return true;
    }
    const invalidType = !VALID_EXTENSIONS.test(selected.name);
    const invalidSize = selected.size > MAX_FILE_BYTES;
    let message = '';
    if (invalidType) message = 'Please attach a JPG, PNG, or PDF file.';
    else if (invalidSize) message = 'Your attachment is larger than 10 MB. Please choose a smaller file or email the photos separately.';

    if (message) {
      fileInput.setCustomValidity(message);
      fileStatus.classList.add('error');
      fileStatus.textContent = message;
      return false;
    }
    fileStatus.classList.remove('error');
    fileStatus.textContent = 'Attached: ' + selected.name;
    return true;
  }

  function updateContactPreference() {
    if (!phoneInput || !contactPreference) return;
    const needsPhone = contactPreference.value === 'Phone call';
    phoneInput.required = needsPhone;
    if (phoneLabelOptional) {
      phoneLabelOptional.textContent = needsPhone ? '(required for phone contact)' : '(optional)';
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const valid = checkAttachment();
      if (!valid) fileInput.reportValidity();
    });
  }
  if (contactPreference) {
    contactPreference.addEventListener('change', updateContactPreference);
    updateContactPreference();
  }
  form.addEventListener('submit', event => {
    if (!checkAttachment()) {
      event.preventDefault();
      fileInput.reportValidity();
    }
  });
})();
