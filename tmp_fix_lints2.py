import os
import re

base_dir = r"c:\Users\aleja\astromodif\TurkamericaStandard\src"

# 1. Admin-Contributions.html: add aria-label to close modal button
for folder in ["", "en", "pt"]:
    f = os.path.join(base_dir, folder, "Admin-Contributions.html")
    if not os.path.exists(f): continue
    with open(f, 'r', encoding='utf-8') as file: content = file.read()
    
    # Target the specific multiline button at line 181
    pattern = re.compile(r'(<button type="button"\s+class="close-modal[^"]*"\s+onclick="closeModal\(\)">)', re.MULTILINE)
    if "Cerrar" in content or "Confirmar" in content:
        content = pattern.sub(r'\1 aria-label="Cerrar"', content)
    elif "Close" in content or "Confirm" in content:
        content = pattern.sub(r'\1 aria-label="Close"', content)
    else:
        content = pattern.sub(r'\1 aria-label="Fechar"', content)
        
    with open(f, 'w', encoding='utf-8') as file: file.write(content)

# 2. Nivel*.html: change id="seo-lesson-{{key}}" to data-lesson-id="{{key}}"
for folder in ["", "en", "pt"]:
    for lvl in ["NivelA1.html", "NivelA2.html", "NivelB1.html", "NivelB2.html", "NivelC1.html"]:
        f = os.path.join(base_dir, folder, lvl)
        if os.path.exists(f):
            with open(f, 'r', encoding='utf-8') as file: content = file.read()
            content = content.replace('id="seo-lesson-{{key}}"', 'data-lesson-id="{{key}}"')
            with open(f, 'w', encoding='utf-8') as file: file.write(content)

# 3. ChinoStandardS lesson-editor.js suppress document.execCommand warning
chino_js = r"c:\Users\aleja\astromodif\ChinoStandardS\src\js\lesson-editor.js"
if os.path.exists(chino_js):
    with open(chino_js, 'r', encoding='utf-8') as file: content = file.read()
    content = content.replace("document.execCommand(command, false, value);", "// @ts-ignore\n    document.execCommand(command, false, value);")
    content = content.replace("document.execCommand(command, false, null);", "// @ts-ignore\n    document.execCommand(command, false, null);")
    with open(chino_js, 'w', encoding='utf-8') as file: file.write(content)

turk_js = r"c:\Users\aleja\astromodif\TurkamericaStandard\src\js\lesson-editor.js"
if os.path.exists(turk_js):
    with open(turk_js, 'r', encoding='utf-8') as file: content = file.read()
    content = content.replace("document.execCommand(command, false, value);", "// @ts-ignore\n    document.execCommand(command, false, value);")
    content = content.replace("document.execCommand(command, false, null);", "// @ts-ignore\n    document.execCommand(command, false, null);")
    with open(turk_js, 'w', encoding='utf-8') as file: file.write(content)

print("Final linting fixes applied successfully!")
