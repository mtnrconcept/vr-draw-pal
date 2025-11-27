# Instructions pour ajouter le changement d'image overlay dans ARMode

## Modification 1: Ajouter l'état (ligne ~89)
Après `const [isManualAnchorEditing, setIsManualAnchorEditing] = useState(false);`

Ajouter:
```tsx
const [isChangingOverlay, setIsChangingOverlay] = useState(false);
```

## Modification 2: Ajouter la fonction updateOverlayImage (ligne ~1127, avant handleConfigurationReady)

```tsx
const updateOverlayImage = async (newOverlayUrl: string) => {
  if (!activeConfigRef.current) {
    toast.error("Aucune configuration active. Veuillez d'abord configurer les ancres.");
    return;
  }

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = newOverlayUrl;
    });
    setOverlayImage(img);

    // Update the configuration
    const updatedConfig: TrackingConfiguration = {
      ...activeConfigRef.current,
      overlayImage: newOverlayUrl,
      overlayPreview: newOverlayUrl,
    };
    activeConfigRef.current = updatedConfig;
    updateConfiguration(updatedConfig);

    setOverlayImageUrl(newOverlayUrl);
    toast.success("Image overlay mise à jour");
  } catch (error) {
    console.error("Failed to load new overlay image:", error);
    toast.error("Impossible de charger la nouvelle image");
  }
};
```

## Modification 3: Ajouter le bouton (ligne ~1494, après le bouton "Importer une image AR")

```tsx
{currentConfig && (
  <Button
    type="button"
    variant="outline"
    className="h-12 w-full min-w-[220px] rounded-full text-xs font-semibold uppercase tracking-widest lg:w-auto"
    onClick={() => setIsChangingOverlay(true)}
  >
    <ImagePlus className="mr-2 h-4 w-4" />
    Changer l'image
  </Button>
)}
```

## Modification 4: Ajouter le dialog (ligne ~1593, juste avant le dernier `</div>` et `);`)

```tsx
{/* Dialog pour changer l'image overlay */}
{isChangingOverlay && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div className="w-full max-w-md rounded-lg bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Changer l'image overlay</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Sélectionnez une nouvelle image à projeter. Les ancres de tracking resteront inchangées.
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                await updateOverlayImage(dataUrl);
                setIsChangingOverlay(false);
              }
            };
            reader.readAsDataURL(file);
          }
        }}
        className="mb-4 w-full"
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsChangingOverlay(false)}
          className="flex-1"
        >
          Annuler
        </Button>
      </div>
    </div>
  </div>
)}
```

## Test
Après ces modifications:
1. Configurez vos ancres avec une image
2. Un nouveau bouton "Changer l'image" apparaîtra
3. Cliquez dessus pour sélectionner une nouvelle image
4. L'image sera mise à jour sans refaire la configuration des ancres
