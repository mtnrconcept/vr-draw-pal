export interface PencilZone {
    id: string;
    pencil: string;
    description: string;
    color: string; // Overlay color (r, g, b)
    thresholdMin: number; // 0-255 luminance
    thresholdMax: number; // 0-255 luminance
}

// Full range from 6H (lightest) to 12B (darkest)
// Luminance: 0 (black) to 255 (white)
export const PENCIL_ZONES: PencilZone[] = [
    { id: "zone-12b", pencil: "12B", description: "Noirs profonds", color: "75, 0, 130", thresholdMin: 0, thresholdMax: 18 }, // Indigo
    { id: "zone-10b", pencil: "10B", description: "Noirs intenses", color: "148, 0, 211", thresholdMin: 19, thresholdMax: 36 }, // Dark Violet
    { id: "zone-8b", pencil: "8B", description: "Ombres très foncées", color: "199, 21, 133", thresholdMin: 37, thresholdMax: 54 }, // Medium Violet Red
    { id: "zone-6b", pencil: "6B", description: "Ombres foncées", color: "255, 0, 0", thresholdMin: 55, thresholdMax: 72 }, // Red
    { id: "zone-5b", pencil: "5B", description: "Ombres marquées", color: "255, 69, 0", thresholdMin: 73, thresholdMax: 90 }, // Red Orange
    { id: "zone-4b", pencil: "4B", description: "Ombres", color: "255, 140, 0", thresholdMin: 91, thresholdMax: 108 }, // Dark Orange
    { id: "zone-3b", pencil: "3B", description: "Ombres moyennes", color: "255, 215, 0", thresholdMin: 109, thresholdMax: 126 }, // Gold
    { id: "zone-2b", pencil: "2B", description: "Valeurs moyennes sombres", color: "255, 255, 0", thresholdMin: 127, thresholdMax: 144 }, // Yellow
    { id: "zone-b", pencil: "B", description: "Valeurs moyennes", color: "173, 255, 47", thresholdMin: 145, thresholdMax: 162 }, // Green Yellow
    { id: "zone-hb", pencil: "HB", description: "Valeurs neutres", color: "50, 205, 50", thresholdMin: 163, thresholdMax: 180 }, // Lime Green
    { id: "zone-h", pencil: "H", description: "Gris légers", color: "0, 255, 255", thresholdMin: 181, thresholdMax: 198 }, // Cyan
    { id: "zone-2h", pencil: "2H", description: "Lumières douces", color: "30, 144, 255", thresholdMin: 199, thresholdMax: 216 }, // Dodger Blue
    { id: "zone-4h", pencil: "4H", description: "Lumières", color: "0, 0, 255", thresholdMin: 217, thresholdMax: 234 }, // Blue
    { id: "zone-6h", pencil: "6H", description: "Hautes lumières", color: "0, 0, 139", thresholdMin: 235, thresholdMax: 255 }, // Dark Blue
];

export const processImageForPencils = (
    imageElement: HTMLImageElement,
    activeFilter: string | null,
    isolateZone: boolean = false
): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;

    // Draw original image
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Create a new ImageData for the output
    const outputData = ctx.createImageData(canvas.width, canvas.height);
    const outputPixels = outputData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Find matching zone
        const zone = PENCIL_ZONES.find(z => luminance >= z.thresholdMin && luminance <= z.thresholdMax);

        if (zone) {
            const isMatch = activeFilter ? zone.pencil === activeFilter : true;

            if (isolateZone) {
                // Isolate Mode: Show only pixels in the active zone (or all if no filter)
                // If filtered and not match -> transparent
                if (activeFilter && !isMatch) {
                    outputPixels[i + 3] = 0;
                } else {
                    // Show original pixel
                    outputPixels[i] = r;
                    outputPixels[i + 1] = g;
                    outputPixels[i + 2] = b;
                    outputPixels[i + 3] = 255;
                }
            } else {
                // Overlay Mode: Show colored overlay
                if (activeFilter && !isMatch) {
                    // If filtered out, transparent
                    outputPixels[i + 3] = 0;
                } else {
                    // Apply zone color
                    const [zR, zG, zB] = zone.color.split(',').map(Number);
                    outputPixels[i] = zR;
                    outputPixels[i + 1] = zG;
                    outputPixels[i + 2] = zB;
                    outputPixels[i + 3] = 100; // ~40% opacity for overlay
                }
            }
        }
    }

    ctx.putImageData(outputData, 0, 0);
    return canvas.toDataURL();
};
