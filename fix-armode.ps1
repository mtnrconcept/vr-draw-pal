# Script pour corriger le fichier ARMode.tsx
$filePath = "src\components\drawmaster\ARMode.tsx"
$content = Get-Content $filePath -Raw

# Supprimer les lignes parasites
$content = $content -replace '\{/\* Dialog pour changer l''image overlay \*/ \}\r?\n\s*\{\r?\n\s*isChangingOverlay', '{/* Dialog pour changer l''image overlay */}`r`n    {isChangingOverlay'
$content = $content -replace '\)\r?\n\s*\}\r?\n\s*</div\s*>\r?\n\s*\)\;', ')}`r`n  </div>`r`n  );'

# Sauvegarder
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Fichier corrigé !"
