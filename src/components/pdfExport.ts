interface Section {
  title: string;
  content: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatContent(content: string): string {
  const lines = content.split('\n');
  let html = '';
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${formatInline(line.slice(2))}</li>`;
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        html += '<ol>';
        inList = true;
      }
      const text = line.replace(/^\d+\.\s/, '');
      html += `<li>${formatInline(text)}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (line === '') {
        html += '<br />';
      } else {
        html += `<p>${formatInline(line)}</p>`;
      }
    }
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

function formatInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  return result;
}

export function exportToPDF(filename: string, sections: Section[]): void {
  const sectionsHtml = sections
    .map(
      (section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        ${formatContent(section.content)}
      </section>
    `
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(filename)}</title>
  <style>
    @page {
      margin: 1in;
      size: A4;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
      padding: 40px;
    }

    h1 {
      font-size: 22pt;
      font-weight: 700;
      margin-bottom: 8px;
      color: #111;
      border-bottom: 2px solid #D4AF37;
      padding-bottom: 8px;
    }

    .meta {
      font-size: 10pt;
      color: #666;
      margin-bottom: 24px;
      font-style: italic;
    }

    section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 15pt;
      font-weight: 600;
      color: #222;
      margin-bottom: 8px;
      margin-top: 16px;
    }

    p {
      margin-bottom: 8px;
      text-align: justify;
    }

    ul, ol {
      margin: 8px 0 8px 24px;
    }

    li {
      margin-bottom: 4px;
    }

    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    code {
      font-family: 'Courier New', monospace;
      font-size: 10.5pt;
      background: #f4f4f4;
      padding: 1px 4px;
      border-radius: 3px;
    }

    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 16px 0;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(filename)}</h1>
  <div class="meta">Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}</div>
  <hr />
  ${sectionsHtml}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('Popup blocked — allow popups to export PDF.');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
