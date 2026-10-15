"""Extract the workbook specification with Python's standard library; no formula evaluation."""
from pathlib import Path
import hashlib, json, zipfile, xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / "data/config.json").read_text())
path = ROOT / config["workbookFile"]
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(path) as archive:
    strings = []
    if "xl/sharedStrings.xml" in archive.namelist():
        strings = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", ns)]
    relationships = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
    sheets = {}
    for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", ns):
        target = relationships[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        rows = []
        for row in ET.fromstring(archive.read(target)).findall("s:sheetData/s:row", ns):
            cells = []
            for cell in row:
                letters = "".join(c for c in cell.attrib["r"] if c.isalpha())
                index = 0
                for c in letters: index = index * 26 + ord(c) - 64
                while len(cells) < index: cells.append(None)
                value = cell.find("s:v", ns)
                if cell.attrib.get("t") == "inlineStr": value = "".join(cell.find("s:is", ns).itertext())
                elif value is not None: value = strings[int(value.text)] if cell.attrib.get("t") == "s" else value.text
                else: value = None
                cells[index-1] = value
            rows.append(cells)
        sheets[sheet.attrib["name"]] = rows
    def body(name, first):
        return [r for r in sheets[name] if r and r[0] and r[0] not in first]
    result = {
        "workbookFile": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "categories": [{"name": r[0], "subcategories": r[1].split("; "), "rule": r[2]} for r in body("Categories", ["CATEGORIES", "Primary category"])],
        "coverage": [{"id": r[0], "title": r[1], "scope": r[2], "state": r[3], "reference": r[4], "notes": r[5]} for r in body("Coverage", ["COVERAGE", "ID"])],
        "rubric": sheets["Rubric"], "dictionary": sheets["Data dictionary"],
    }
    out = ROOT / "data/generated/specification.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(f"Extracted {len(result['categories'])} categories and {len(result['coverage'])} coverage entries.")
