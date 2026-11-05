export function download(payload: string, name: string, type = 'application/json') {
  const link = document.createElement('a');
  link.download = name;
  const url = URL.createObjectURL(new Blob([payload], { type }));
  link.href = url;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Give browsers time to begin the download before releasing its bytes.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
