/* =========================================================
   UPLOAD → SUPABASE STORAGE
   Loaded only on upload.html, after supabase-config.js.
   Handles: drag/drop + file picker preview, then real upload
   to the "vault-photos" Storage bucket on click.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const thumbGrid = document.getElementById('thumbGrid');
  const uploadBtn = document.getElementById('uploadBtn');

  if (!dropzone || !fileInput) return;

  const BUCKET = 'vault-photos';
  const pending = new Map(); // thumbnail element -> File

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); })
  );
  dropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => addFiles(fileInput.files));

  function addFiles(files) {
    [...files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = document.createElement('div');
        item.className = 'thumb-item';
        item.style.backgroundImage = `url(${e.target.result})`;
        item.innerHTML = `
          <button class="remove" type="button" aria-label="Remove">✕</button>
          <div class="bar"><div class="bar-fill"></div></div>
        `;
        thumbGrid.appendChild(item);
        item.querySelector('.remove').addEventListener('click', () => {
          pending.delete(item);
          item.remove();
          if (uploadBtn) uploadBtn.disabled = pending.size === 0;
        });
        pending.set(item, file);
        if (uploadBtn) uploadBtn.disabled = pending.size === 0;
      };
      reader.readAsDataURL(file);
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      if (pending.size === 0) return;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading…';

      const jobs = [...pending.entries()].map(([item, file]) => uploadOne(item, file));
      const results = await Promise.allSettled(jobs);

      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = results.length - failed;

      if (failed === 0) {
        showToast(`${succeeded} photo${succeeded === 1 ? '' : 's'} uploaded to your vault`);
        setTimeout(() => window.go('dashboard.html'), 900);
      } else {
        showToast(`${succeeded} uploaded, ${failed} failed — see console for details`);
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Retry Failed Uploads';
      }
    });
  }

  async function uploadOne(item, file) {
    const bar = item.querySelector('.bar-fill');
    bar.style.width = '15%';

    // Supabase's upload() is a single fetch call under the hood, so there's
    // no native byte-level progress event — these widths are a visual
    // "in progress / done" indicator, not a real progress measurement.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    try {
      bar.style.width = '60%';
      const { error: uploadError } = await supabaseClient
        .storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;
      bar.style.width = '90%';

      // Optional metadata row so the photo can be listed back later.
      // Non-fatal if it fails — the file itself is already safely stored.
      const { error: dbError } = await supabaseClient
        .from('photos')
        .insert({
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type
        });
      if (dbError) console.warn('Uploaded, but metadata insert failed:', dbError.message);

      bar.style.width = '100%';
      item.classList.add('upload-done');
      return true;
    } catch (err) {
      console.error('Upload failed for', file.name, err);
      bar.style.background = 'var(--c-danger)';
      bar.style.width = '100%';
      item.classList.add('upload-failed');
      throw err;
    }
  }
});
