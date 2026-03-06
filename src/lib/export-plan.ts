import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageNumber,
  Footer,
  Header,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

export function downloadMarkdown(markdown: string, companyName: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, `${companyName || "AI"}_Strategic_Plan.md`);
}

export async function downloadPdf(elementId: string, companyName: string) {
  // Dynamic import to avoid SSR issues
  const html2pdf = (await import("html2pdf.js")).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: [0.75, 0.75, 0.75, 0.75] as [number, number, number, number],
    filename: `${companyName || "AI"}_Strategic_Plan.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  await html2pdf().set(opt).from(element).save();
}

function parseMarkdownToDocxElements(
  markdown: string,
  companyName: string,
  date: string
): Paragraph[] {
  const elements: Paragraph[] = [];

  // Cover page
  elements.push(new Paragraph({ spacing: { after: 4000 } }));
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: companyName || "Organization", size: 56, bold: true, font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: "AI Strategic Plan", size: 40, font: "Arial", color: "B8860B" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: date, size: 24, color: "666666", font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: "Prepared by AI Strategic Planner", size: 20, color: "999999", font: "Arial" })],
      alignment: AlignmentType.CENTER,
    })
  );
  elements.push(new Paragraph({ pageBreakBefore: true }));

  // Parse markdown lines
  const lines = markdown.split("\n");
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length < 2) {
      tableRows = [];
      inTable = false;
      return;
    }
    // Filter out separator rows
    const dataRows = tableRows.filter((r) => !r.every((c) => /^[-:| ]+$/.test(c)));
    if (dataRows.length === 0) {
      tableRows = [];
      inTable = false;
      return;
    }
    const colCount = dataRows[0].length;
    try {
      const table = new Table({
        rows: dataRows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.slice(0, colCount).map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell.trim(),
                            bold: rowIdx === 0,
                            size: 20,
                            font: "Arial",
                          }),
                        ],
                      }),
                    ],
                    width: { size: Math.floor(9000 / colCount), type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    },
                  })
              ),
            })
        ),
        width: { size: 9000, type: WidthType.DXA },
      });
      elements.push(new Paragraph({ spacing: { before: 200 } }));
      // @ts-ignore - docx types can be finicky with Table vs Paragraph
      elements.push(table as any);
      elements.push(new Paragraph({ spacing: { after: 200 } }));
    } catch {
      // fallback: render as text
      dataRows.forEach((row) => {
        elements.push(new Paragraph({ children: [new TextRun({ text: row.join(" | "), size: 20, font: "Arial" })] }));
      });
    }
    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cells = trimmed.split("|").filter((c) => c.trim() !== "");
      tableRows.push(cells.map((c) => c.trim()));
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      elements.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    // Headings
    const h1 = trimmed.match(/^#\s+(.+)/);
    const h2 = trimmed.match(/^##\s+(.+)/);
    const h3 = trimmed.match(/^###\s+(.+)/);

    if (h1) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: h1[1].replace(/\*\*/g, ""), size: 36, bold: true, font: "Arial" })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: elements.length > 8,
        })
      );
    } else if (h2) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: h2[1].replace(/\*\*/g, ""), size: 30, bold: true, font: "Arial" })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (h3) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: h3[1].replace(/\*\*/g, ""), size: 26, bold: true, font: "Arial" })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.slice(2);
      const parts = text.split(/\*\*(.+?)\*\*/);
      const runs: TextRun[] = [];
      parts.forEach((part, i) => {
      runs.push(new TextRun({ text: part, bold: i % 2 === 1, size: 22, font: "Arial" }));
      });
      elements.push(new Paragraph({ children: runs, bullet: { level: 0 }, spacing: { after: 60 } }));
    } else {
      const parts = trimmed.split(/\*\*(.+?)\*\*/);
      const runs: TextRun[] = [];
      parts.forEach((part, i) => {
        runs.push(new TextRun({ text: part, bold: i % 2 === 1, size: 22, font: "Arial" }));
      });
      elements.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
    }
  }

  if (inTable) flushTable();

  return elements;
}

export async function downloadDocx(markdown: string, companyName: string) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children = parseMarkdownToDocxElements(markdown, companyName, date);

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${companyName} — AI Strategic Plan`, size: 16, color: "999999", font: "Arial" }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: "999999", font: "Arial" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${companyName || "AI"}_Strategic_Plan.docx`);
}
