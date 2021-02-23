# collates sources into a single dictionary.

import json
import re
import pdfplumber
import unicodedata
import unidecode
import copy

with open("resources/data/redact.json") as f:
    redact = json.load(f)

with open("resources/data/rude.json") as f:
    rude = json.load(f)

dictionary = []

creative_spellings = {
    "kwaaaanisum": "kwanisum",
    "aaaankati": "ankati",
    "yooootlkat": "yootlkat",
    "kaaaakwa": "kakwa",
    "mitlaaait": "mitlait",
    "deleeeiiit": "deleit",
    "sayaaaa": "sayaa"
}

def simplify_spelling(word):
    word = unidecode.unidecode(word.lower())
    if word in creative_spellings:
        return creative_spellings[word]
    return word

dict_lookup_cw = dict()

def simplify_orth(entry):
    newcw = []
    value_lookup = dict()
    for ncw in entry["cw"]:
        assert(type(ncw) != list)
        ncw["orth"] = [orth for orth in ncw["orth"] if orth != ""]
        if ncw["value"] in value_lookup:
            pcw = value_lookup[ncw["value"]]
            ncw["orth"] += ["orth"]
        else:
            value_lookup[ncw["value"]] = ncw
            newcw.append(ncw)
    entry["cw"] = newcw

def merge_into(a, b):
    for key in a:
        value = a[key]
        if key in b:
            assert(type(a[key]) == type(b[key]))
            if type(value) == list:
                a[key] += b[key]
    for key in b:
        if key not in a:
            a[key] = b[key]

def merge_dict_entry(entry):
    simple_spellings = [simplify_spelling(cw["value"]) for cw in entry["cw"]]
    merge_entry = entry
    for w in simple_spellings:
        if w in dict_lookup_cw:
            merge_entry = dict_lookup_cw[w]
            break
    for w in simple_spellings:
        dict_lookup_cw[w] = merge_entry

    if merge_entry == entry:
        dictionary.append(merge_entry)
    else:
        merge_into(merge_entry, entry)
    
    simplify_orth(merge_entry)
    for cw in merge_entry["cw"]:
        assert(type(cw) == dict and "value" in cw and "orth" in cw)

def add_dict_entry(**kwargs):
    gloss = [s.strip() for s in kwargs["gloss"]]
    rudegloss = [s for s in gloss if s in redact]
    gloss = [s for s in gloss if s not in redact]
    cw = kwargs["cw"]
    assert(type(cw) == list)
    entry = {
        "gloss": gloss,
        "rudegloss": rudegloss,
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
    for cwdef in cw:
        assert(type(cwdef) == dict)
        if cwdef["value"] in rude:
            entry["rude"] = max(entry.get("rude", 0), rude[cwdef["value"]])
        if "orth" not in cwdef:
            cwdef["orth"] = []
    merge_dict_entry(entry)

# appends an entry to an orths array
def append_cw(orths, s, orthography):
    if s != "":
        for value in s.split(","):
            orths.append({"value": value.strip(), "orth": [orthography]})

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

# hykwa
with open("resources/data/hykwa.json") as f:
    source = json.load(f)
    for entry in source:
        add_dict_entry(
            gloss=entry.get('gloss', []),
            cw=entry.get('cw', []),
            sources=entry.get("sources", []) + ["hykwa"],
            tags=entry.get("tags", []),
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


hobbyists = ["qw", "lusentoj", "qalis", "q́alis", "OrthodoxFox", "hykwa"]

# fix entries
for entry in dictionary:
    only_hobbyist = True
    entry["fuse-gloss"] = ",    ".join(entry["gloss"] + entry.get("rudegloss", []))
    for source in entry["sources"]:
        if source not in hobbyists:
            only_hobbyist = False
            break
    if only_hobbyist:
        if "tags" in entry:
            entry["tags"].append("Uncited")
        else:
            entry["tags"] = ["Uncited"]

usages = []

valid_pdf_chars = "”–“ʔəʷšĆŦƏɬꞭ"
is_footnote = re.compile(
    "^\s*[0-9]+\s*[^\s\.]"
)

wordre_nonum = re.compile("((?=[^0-9])[\w'])+")
wordre = re.compile("[\w']+")
renums = re.compile("((?=[^0-9])[\w;\.,\'\?\!\":\)\(\[\]\}\{])[0-9]+")

with open("sources/words_dictionary.json") as f:
    english_dict = json.load(f)
    ignores = ["pos", "hous", "haws", "okok", "injun", "stik", "kopa", "alta", "wel", "spos"]
    for ignore in ignores:
        if ignore in english_dict:
            english_dict.pop(ignore)

def extract_words(s, nonum=False):
    return list((wordre_nonum if nonum else wordre).findall(s))

def is_wawa_fuzzy(words):
    words = list(filter(lambda s:
        s not in ["man", "chinook", "jim", "sun"], words
    ))
    nonenglish = list(filter(
        lambda s: s.lower() not in english_dict,
        words
    ))
    return len(nonenglish) > 0.5 * len(words)

unrecognized = set()

def match_defn(word):
    wl = simplify_spelling(word)
    if wl in dict_lookup_cw:
        return dict_lookup_cw[wl]
    else:
        return None

with open("resources/data/snass_sessions.json") as f:
    sessions = json.load(f)
    for i, session in enumerate(sessions):
        print("processing snass session",i)
        if session["url"] == "":
            continue
        with pdfplumber.open("sources/snass/snass" + str(i) + ".pdf") as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text is None:
                    continue
                text = "".join(filter(lambda c: ord(c) < 255 or c in valid_pdf_chars, text))
                for line in text.splitlines():
                    if is_footnote.match(line):
                        # process no further lines on footnote.
                        break
                    if line.strip().lower() == "spelling rules:":
                        break
                    if line.strip().lower().startswith("consonants:"):
                        break
                    line = re.sub(renums, "\\1 ", line.replace("“", "\"").replace("”","\""))
                    words = extract_words(line)
                    if is_wawa_fuzzy(words):
                        for word in words:
                            defn = match_defn(word)
                            if defn is None:
                                unrecognized.add(word)

#if len(unrecognized) > 0:
#    print("unrecognized words:", unrecognized)

with open("resources/js/generated/dict.js", "w") as f:
    print("writing dictionary file:", len(dictionary), "entries")
    f.write("const dictionary = " + json.dumps(dictionary, indent = 2))