const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

export default function LinkifiedText({
  text,
  className,
  linkClassName,
}: {
  text: string;
  className?: string;
  linkClassName?: string;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  // A fresh regex per render: a shared global one carries `lastIndex` between
  // calls, so consecutive renders would start scanning mid-string.
  const urlRe = new RegExp(URL_PATTERN.source, "g");

  while ((match = urlRe.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName ?? "underline break-all"}
      >
        {url}
      </a>,
    );
    last = match.index + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <span className={className}>{parts}</span>;
}
