# collates sources into a single dictionary.

import json
import re

dictionary = []

def add_dict_entry(**kwargs):
    gloss = [s.strip() for s in kwargs["gloss"]]
    cw = kwargs["cw"]
    entry = {
        "gloss": gloss,
        "fuse-gloss": ",    ".join(gloss),
        "cw": cw
    }
    if "sources" in kwargs and len(kwargs["sources"]) > 0:
        entry["sources"] = kwargs["sources"]
    if "tags" in kwargs and len(kwargs["tags"]) > 0:
        entry["tags"] = kwargs["tags"]
    if "itags" in kwargs and len(kwargs["itags"]) > 0:
        entry["itags"] = kwargs["itags"]
    if "origin" in kwargs and origin["language"] != "":
        entry["origin"] = kwargs["origin"]
    dictionary.append(entry)

# appends an entry to an orths array
def append_cw(orths, s, orthography):
    if s != "":
        for value in s.split(","):
            orths.append({"value": value.strip(), "orth": orthography})

def convert_to_rgb(col):
    if "red" in col and "blue" in col and "green" in col:
        r = int(0xff * col["red"])
        g = int(0xff * col["green"])
        b = int(0xff * col["blue"])
        return (r << 16) | (g << 8) | b
    return 0xffffff

# collect entries

# QW
sourcemap = {
    "Zenk 2010": "Zenk",
    "App": "App",
    "Nsayka Ulman-Tilixams": "Grand Ronde",
    "Making Wawa": "Lang",
    "R J Holton": "Holton",
    "Gibbs 1863": "Gibbs",
    "Gill 1909": "Gill",
    "Hibbens 1889": "Hibbens",
    "Shaw 1909": "Shaw",
    "James Swan 1857": "Swan",
    "Powell 1985": "Powell 1985",
    "Lionnet 1853": "Lionnet",
    "Demers 1871": "Demers",
    "Palmer 1847": "Palmer",
    "Ross 1849": "Ross",
    "Boas 1892": "Boas",
    "Schoolcraft 1853": "Schoolcraft",
    "(lusentoj)": "lusentoj",
    "(lustentoj)": "lusentoj",
    "qw": "qw"
}
with open("sources/qw_cited_map.json") as f:
    qw_cited_map = json.load(f)
qw_word_language_extract = re.compile("^([^\{\?]*)(\??\s*\{(.*)\})?.*?(\?)?$")
for path in ["sources/qw_simp.json", "sources/qw_comp.json"]:
    with open(path, "r") as f:
        source = json.load(f)
        for entry in source:
            # marshall
            orths = []
            tags = []
            itags = []
            sources = []

            assert isinstance(entry['gloss'], str)

            # origin
            origin = {
                "language": entry["origin-language"],
                "language-full": entry["origin-language"],
                "word": entry["origin-word"],
                "unknown": False
            }
            if origin["language"] == "Unknown":
                origin["language-full"] = ""
                origin["language"] = ""
            wordparse = qw_word_language_extract.search(origin["word"])
            if wordparse[4] is not None:
                origin["unknown"] = True
            origin["word"] = wordparse[1].strip()
            if wordparse[3] is not None:
                origin["language-full"] += "/" + wordparse[3]
                origin["language"] = wordparse[3]
                if origin["language"].startswith("via "):
                    origin["language"] = origin["language"][4:]
                if origin["language"].endswith("?"):
                    origin["language"] = origin["language"][:-1]
                    origin["unknown"] = True
                if origin["language-full"].startswith("Other/"):
                    origin["language-full"] = origin["language-full"][5:]
                if origin["language-full"].startswith("/"):
                    origin["language-full"] = origin["language-full"][1:]

            # sources
            for source in [entry["source-gr"], entry["source-d1"], entry["source-d2"]] + entry["source-alt"] + ["qw"]:
                source = source.strip()
                if len(source.strip()) > 0:
                    if source in sourcemap:
                        sources.append(sourcemap[source])
                    elif source in qw_cited_map:
                        source_cited = qw_cited_map[source]
                        if type(source_cited) == type("") and source_cited in sourcemap:
                            sources.append(sourcemap[source_cited])
                        else:
                            sources.append(source_cited)
                    else:
                        print("Unrecognized source: (won't be listed)", source)

            # tags
            if entry["compound"]:
                tags.append("Compound")
            rgb_attest = convert_to_rgb(entry["colour-attest"])
            rgb_origin = convert_to_rgb(entry["colour-source"])

            # colour-tags
            if rgb_attest == 0xfff1cc:
                tags.append("Limited")
            if rgb_attest == 0xf4cccc or rgb_attest == 0xe6b8ae:
                tags.append("Dubious")
            if rgb_attest == 0x6fa8dc or rgb_attest == 0xc9daf7:
                tags.append("Archaic")
            if rgb_attest == 0x3d85c6:
                tags.append("Neologism")
            if rgb_attest == 0xd9d1e9:
                tags.append("KW/Northern")
            if rgb_attest == 0xd9ead3:
                tags.append("GR/Southern")
            
            if rgb_origin == 0xd9d9d9:
                origin["unknown"] = True
            
            append_cw(orths, entry["cw-qw"], "qw")
            # ignore cw-phonetic, because it's defunct.
            append_cw(orths, entry["cw-practical"], "dr")
            append_cw(orths, entry["cw-duployan"], "pp")
            append_cw(orths, entry["cw-attested"], "")
            add_dict_entry(
                gloss=entry["gloss"].split(","),
                cw=orths,
                origin=origin,
                sources=sources,
                tags=tags,
                itags=itags # not currently used
            )

# LJ
"""
extract_entries = re.compile(
    "^([^>›»]*)([>›»]((([^,<‹«])*,)*([^<‹«]*))[<‹«])?$"
)
extract_brace = re.compile(
    "\{([^\}]*)\}"
)
extract_square = re.compile(
    "\[([^\}]*)\]"
)
with open("sources/lj.json", "r") as f:
    source = json.load(f)
    for entry in source:

        # extract cw
        cwm = extract_entries.match(entry["cw"])
        if cwm is None:
            continue
        cw_entries = [cwm.group(1)] + (cwm.group(3).split(",") if cwm.group(3) is not None else [])
        if len(cw_entries) == 0:
            continue
        asterisk = False
        if cw_entries[0].startswith("*"):
            cw_entries[0] = cw_entries[0][1:]
            asterisk = True
        
        # not sure what asterisk means, so we'll ignore these entries for now.
        if asterisk:
            continue
            
        # extract gloss
        gloss = entry["gloss"].split(",")
        
        # notes
        notes = entry["notes"]
        while len(notes.strip() > 0):
            notes = notes.strip()
            # attempt to extract a note.
            mbrace = extract_brace.match(notes)
            msquare = extract_square.match(notes)
            if mbrace:
                pass
            elif msquare:
                pass
            else:
                # can't match.
                break
"""


hobbyists = ["qw", "lusentoj", "qalis", "q́alis", "OrthodoxFox"]

# fix entries
for entry in dictionary:
    only_hobbyist = True
    for source in entry["sources"]:
        if source not in hobbyists:
            only_hobbyist = False
            break
    if only_hobbyist:
        if "tags" in entry:
            entry["tags"].append("Uncited")
        else:
            entry["tags"] = ["Uncited"]

with open("dict.js", "w") as f:
    f.write("const dictionary = " + json.dumps(dictionary, indent = 2))