import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

interface FieldPosition {
  x: number;
  y: number;
  fontSize?: number;
  fontColor?: string;
}

interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GenerateRequest {
  surname: string;
  givenNames: string;
  nin: string;
  dateOfBirth: string;
  sex: string;
  photo?: string;
  positions: {
    photo: PhotoPosition;
    surname: FieldPosition;
    givenNames: FieldPosition;
    nin: FieldPosition;
    dateOfBirth: FieldPosition;
    sex: FieldPosition;
  };
  masks?: MaskRect[];
  templateData?: string;
}

function parseColor(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  return {
    r: Number.parseInt(cleaned.substring(0, 2), 16) / 255,
    g: Number.parseInt(cleaned.substring(2, 4), 16) / 255,
    b: Number.parseInt(cleaned.substring(4, 6), 16) / 255,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { surname, givenNames, nin, dateOfBirth, sex, photo, positions, masks, templateData } = body;

    let templateBytes: Uint8Array;

    if (templateData) {
      const base64Data = templateData.split(",")[1] || templateData;
      templateBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      const templatePath = join(process.cwd(), "public", "template.pdf");
      const fileBuffer = await readFile(templatePath);
      templateBytes = new Uint8Array(fileBuffer);
    }

    const pdfDoc = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
    });

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { width: pageWidth, height: pageHeight } = page.getSize();

    const rotation = page.getRotation();
    const rotationAngle = rotation.angle;

    let effectiveWidth = pageWidth;
    let effectiveHeight = pageHeight;
    if (rotationAngle === 90 || rotationAngle === 270) {
      effectiveWidth = pageHeight;
      effectiveHeight = pageWidth;
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    if (masks && masks.length > 0) {
      for (const mask of masks) {
        page.drawRectangle({
          x: mask.x,
          y: effectiveHeight - mask.y - mask.height,
          width: mask.width,
          height: mask.height,
          color: rgb(1, 1, 1),
        });
      }
    }

    const drawTextField = (
      text: string,
      pos: FieldPosition,
      useBold = false,
    ) => {
      const fontSize = pos.fontSize || 12;
      const color = pos.fontColor
        ? parseColor(pos.fontColor)
        : { r: 0, g: 0, b: 0 };

      page.drawText(text, {
        x: pos.x,
        y: effectiveHeight - pos.y - fontSize,
        size: fontSize,
        font: useBold ? fontBold : font,
        color: rgb(color.r, color.g, color.b),
      });
    };

    drawTextField(surname.toUpperCase(), positions.surname, true);
    drawTextField(givenNames, positions.givenNames);
    drawTextField(nin, positions.nin);
    drawTextField(dateOfBirth, positions.dateOfBirth);
    drawTextField(sex, positions.sex);

    if (photo) {
      try {
        const photoBase64 = photo.split(",")[1] || photo;
        const photoBytes = Uint8Array.from(atob(photoBase64), (c) =>
          c.charCodeAt(0),
        );

        let image;
        if (photo.includes("image/png")) {
          image = await pdfDoc.embedPng(photoBytes);
        } else {
          image = await pdfDoc.embedJpg(photoBytes);
        }

        const photoPos = positions.photo;

        page.drawImage(image, {
          x: photoPos.x,
          y: effectiveHeight - photoPos.y - photoPos.height,
          width: photoPos.width,
          height: photoPos.height,
        });
      } catch (imgError) {
        console.error("Error embedding photo:", imgError);
      }
    }

    const pdfBytes = await pdfDoc.save();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `generated_document_${timestamp}.pdf`;

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
  }
    
