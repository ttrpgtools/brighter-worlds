const dateFmt = Intl.DateTimeFormat('en-UK', {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false});

export function toNiceTimestamp(d: Date) {
  return dateFmt.format(d);
}