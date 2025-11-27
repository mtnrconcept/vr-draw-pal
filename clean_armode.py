import re

# Lire le fichier
with open('src/components/drawmaster/ARMode.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Supprimer les lignes parasites avant le dialog
# Chercher "    </div>\n\n  )" et les lignes qui suivent jusqu'au vrai dialog
pattern1 = r'    </div>\r?\n\r?\n\s*\)\r?\n\s*\r?\n\s*{/\* Dialog pour changer l\'image overlay \*/ }\r?\n\s*{\r?\n\s*isChangingOverlay'
replacement1 = '    </div>\n\n    {/* Dialog pour changer l\'image overlay */}\n    {isChangingOverlay'

content = re.sub(pattern1, replacement1, content)

# Pattern 2: Supprimer les lignes parasites à la fin
# Chercher "    )\n  }\n  </div >" et remplacer par la bonne structure
pattern2 = r'    \)\r?\n\s*}\r?\n\s*</div\s*>\r?\n\s*\);'
replacement2 = '    )}\n  </div>\n  );'

content = re.sub(pattern2, replacement2, content)

# Écrire le fichier
with open('src/components/drawmaster/ARMode.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("Fichier nettoyé avec succès!")
