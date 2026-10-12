-- Evidence Vault files now go from the browser straight to Storage on a
-- signed upload URL, so the bucket itself enforces the same limits the app
-- checks: 15MB per file, and only the photo and document types the app
-- accepts (src/lib/uploadValidation.ts ALLOWED_DOC_MIME_TYPES + image/*).
-- finalizeEvidenceUpload also re-checks size and type from Storage's own
-- record and deletes anything that fails; this stops it at the door.

update storage.buckets
set file_size_limit = 15728640, -- 15 * 1024 * 1024
    allowed_mime_types = array[
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
where id = 'evidence';

-- Check (read-only): expect one row, file_size_limit = 15728640 and the
-- eight types above.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'evidence';
