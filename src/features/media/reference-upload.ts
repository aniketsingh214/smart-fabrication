/** A single reference upload retains its intent after provider success for confirmation retries. */
export function referenceUpload(file: File, token: string, send: typeof fetch = fetch) {
  let intentId: string | undefined, asset: { id: string } | undefined, busy = false;
  const headers = { 'Content-Type': 'application/json', 'X-Enquiry-Upload-Token': token };
  return async () => {
    if (busy) throw new Error('Reference upload is already in progress');
    if (asset) return asset;
    busy = true;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP design up to 10 MB.');
      if (!intentId) {
        const signed = await send('/api/v1/uploads/guest/sign', { method: 'POST', headers, body: JSON.stringify({ context: 'customer_design', bytes: file.size, format: file.type.split('/')[1] }) });
        const payload = await signed.json();
        if (!signed.ok) throw new Error(payload.error?.message ?? 'Reference upload could not be prepared');
        const { data } = payload, body = new FormData();
        body.set('file', file); body.set('api_key', data.apiKey); body.set('signature', data.signature);
        for (const [key, value] of Object.entries(data.params)) body.set(key, String(value));
        const uploaded = await send(data.uploadUrl, { method: 'POST', body });
        if (!uploaded.ok) throw new Error('Reference upload failed. Your enquiry is still saved.');
        intentId = data.intentId;
      }
      const response = await send('/api/v1/uploads/guest/confirm', { method: 'POST', headers, body: JSON.stringify({ intentId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? 'Reference image could not be verified');
      if (typeof body.data?.id !== 'string' || !body.data.id) throw new Error('Reference image confirmation is missing');
      asset = { id: body.data.id }; return asset;
    } finally { busy = false; }
  };
}
