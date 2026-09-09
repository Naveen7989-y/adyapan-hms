/**
 * Utility to download binary files (e.g. PDFs) from authenticated API endpoints
 * @param {string} endpoint - API relative path e.g. '/billing/invoices/123/pdf'
 * @param {string} filename - Target download filename e.g. 'Invoice-INV-2026-0001.pdf'
 */
export const downloadAuthenticatedFile = async (endpoint, filename) => {
  const token = localStorage.getItem('adyapan_token');
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let errorMsg = 'Failed to download document';
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch (_) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};
