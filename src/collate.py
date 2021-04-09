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

with open("resources/data/separate.json") as f:
    separate = json.load(f)

with open("resources/data/snass_ignore.json") as f:
    snass_ignore = set(json.load(f))

with open("resources/data/snass_3lang.json") as f:
    snass_ntlakaapmah = set(json.load(f))

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
    word = word.lower().replace("k\u0331", "q").replace("h\u0331", "x")
    word = unidecode.unidecode(word)
    if word in creative_spellings:
        return creative_spellings[word]
    return word

def butcher_spelling(word):
    return simplify_spelling(word).replace("q", "k").replace("x", "h")

re_hykwa = re.compile("^[_a-zA'-ZəƏɬꞭ7\- ]+$")

def convert_qw_to_hykwa(q):
    # (temporarily disabled)
    return None
    hy = q
    hy = hy.replace("’", "'")
    hy = hy.replace("\u0323\u0323", "\u0323")
    hy = hy.replace("á́", "á")
    hy = hy.replace("x̣", "xh")
    hy = hy.replace("p̣̣", "p").replace("P̣", "P").replace("p̣", "p")
    hy = hy.replace("ṭ", "t").replace("Ṭ", "T")
    hy = hy.replace("ḳ", "k").replace("ḳ", "k")
    hy = hy.replace("q̣", "q")
    hy = hy.replace("é", "ei")
    hy = hy.replace("ə́", "əə")
    hy = hy.replace("á", "aa").replace("á", "aa")
    hy = hy.replace("ó", "oo").replace("ó", "oo")
    hy = hy.replace("ú", "uu").replace("ú", "uu")
    hy = hy.replace("í", "ii").replace("í", "ii")
    hy = hy.replace("ʔ", "7").replace("Ɂ", "7")

    # general word spellings
    replacements = {
        "ili7i": "ilihi",
        "k'opiit": "kopit",
        "tayii": "taiyi",
        "k'anawi": "kanawi",
        "hayuu": "hayu",
        "alaaxti": "alaxti",
        "gidəəp": "gidəp",
        "k'əltəs": "kəltəs"
    }
    for pre in replacements:
        hy = hy.replace(pre, replacements[pre])
    if "oo" in hy:
        # oo looks bad :C
        return None
    if re_hykwa.match(hy):
        return hy
    else:
        return None

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

idnext = 0
def merge_dict_entry(entry):
    global idnext
    simple_spellings = [simplify_spelling(cw["value"]) if cw["value"] not in separate else cw["value"] for cw in entry["cw"]]
    simple_spellings = [s for s in simple_spellings if s not in separate or s != simplify_spelling(s)]
    merge_entry = entry
    for w in simple_spellings:
        if w in dict_lookup_cw:
            merge_entry = dict_lookup_cw[w]
            if "hykwa" not in entry["sources"]:
                print("merging: ")
                print("    ", entry["cw"])
                print("    ", merge_entry["cw"])
            break
    for w in simple_spellings:
        dict_lookup_cw[w] = merge_entry

    if merge_entry == entry:
        merge_entry["id"] = idnext
        dictionary.append(merge_entry)
        idnext += 1
    else:
        merge_into(merge_entry, entry)
    
    simplify_orth(merge_entry)
    for cw in merge_entry["cw"]:
        assert(type(cw) == dict and "value" in cw and "orth" in cw)

def add_dict_entry(**kwargs):
    gloss = [s.strip() for s in kwargs["gloss"] if s.strip() != ""]
    rudegloss = [s for s in gloss if s in redact]
    gloss = [s for s in gloss if s not in redact]
    cw = kwargs["cw"]
    assert(type(cw) == list)
    entry = {
        "gloss": gloss,
        "rudegloss": rudegloss,
        "cw": [c for c in cw if c["value"] != ""]
    }

    if len(entry["gloss"]) == 0 and len(entry["cw"]) == 0:
        # don't add totally empty entries.
        return

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
            if rgb_attest == 0xc9daf7:
                tags.append("Archaic")
            if rgb_attest == 0x3d85c6 or rgb_attest == 0x6fa8dc:
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
for sourcef in ["resources/data/hykwa_glue.json", "resources/data/hykwa.json"]:
    with open(sourcef) as f:
        source = json.load(f)
        for entry in source:
            add_dict_entry(
                gloss=entry.get('gloss', []),
                cw=entry.get('cw', []),
                sources=entry.get("sources", []) + ["hykwa"],
                tags=entry.get("tags", []),
            )

# qw -> hykwa
for entry in dictionary:
    if "hy" in [cw["orth"] for cw in entry["cw"]]:
        continue
    for cw in entry["cw"]:
        if "qw" in cw["orth"]:
            hy = convert_qw_to_hykwa(cw["value"])
            if hy != None and hy != cw["value"] and hy not in [cw["value"] for cw in entry["cw"]]:
                print("adding hykwa orthography", hy)
                entry["cw"].append(
                    {
                        "value": hy,
                        "orth": "hy"
                    }
                )
            break

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

valid_pdf_chars = "”–“ʔəʷšĆŦƏɬꞭ"
is_footnote = re.compile(
    "^\s*[0-9]+\s*[^\s\.]"
)

wordre_nonum = re.compile("((?=[^0-9])[\w\u0331'])+")
wordre = re.compile("[\w\u0331']+")
renums = re.compile("((?=[^0-9])[\w;\.,\'\?\!\":\)\(\[\]\}\{])[0-9]+")

with open("sources/words_dictionary.json") as f:
    english_dict = json.load(f)
    ignores = ["pos", "hous", "haws", "okok", "injun", "stik", "kopa", "alta", "wel", "spos"]
    for ignore in ignores:
        if ignore in english_dict:
            english_dict.pop(ignore)
    
    # we count ntlakaapmah as english because it is not cw.
    for ntla in snass_ntlakaapmah:
        english_dict[ntla] = 1

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

unrecognized = dict()
alluses = 0

def match_defn(word):
    wl = simplify_spelling(word)
    if wl in dict_lookup_cw:
        return dict_lookup_cw[wl]
    else:
        return None

# construct word-chains
class hash_dict_wrapper:
    def __init__(self, dict):
        self.dict = dict
    def __hash__(self):
        return self.dict["id"]
chains = dict()
for entry in dictionary:
    assert len(entry["cw"]) > 0, "missing cw for " + str(entry)
    assert len(entry["gloss"]) > 0, "missing gloss for " + str(entry)
    for cw in entry["cw"]:
        words = [butcher_spelling(word) for word in extract_words(cw["value"])]
        wordc = len(words)
        for i in range(wordc):
            wordt = tuple(words[:i + 1])
            chain = chains.get(wordt, {"entry": set(), "next": set()})
            chains[wordt] = chain
            if i == wordc - 1:
                chain["entry"].add(hash_dict_wrapper(entry))
            else:
                chain["next"].add(tuple(words[:i+2]))

# process and index corpus
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
                        # need to account for multiple-token words, like "wik ikta qata" and "tloosh-tumtum"
                        def wordchain_usage(wordt):
                            global alluses
                            assert(wordt in chains)
                            for entry in chains[wordt]["entry"]:
                                entry = entry.dict
                                entry["use"] = entry.get("use", 0) + 1
                                alluses += 1
                                use_id = {
                                    "href": session["url"] + "#page=" + str(page.page_number),
                                    "title": session["title"] + " (page " + str(page.page_number) + ")"
                                }
                                entry["uses"] = entry.get("uses", [])
                                if use_id["href"] not in [use["href"] for use in entry["uses"]]:
                                    entry["uses"].append(use_id)

                        wordchains = set()
                        for complex_word in words:
                            word = (butcher_spelling(complex_word),)
                            nextwords = set()
                            if word in chains:
                                nextwords.add(word)
                            for wordt in wordchains:
                                assert(wordt in chains)
                                if wordt + word in chains:
                                    nextwords.add(wordt + word)
                                else:
                                    wordchain_usage(wordt)
                            if len(nextwords) == 0:
                                if word[0] not in snass_ignore and not word[0].isnumeric():
                                    unrecognized[complex_word] = unrecognized.get(complex_word, set())
                                    unrecognized[complex_word].add(session["url"])
                            wordchains = nextwords
                        for wordt in wordchains:
                            wordchain_usage(wordt)

if len(unrecognized) > 0:
    print("unrecognized words:")
    for u in unrecognized:
        print(" ", u + ":", ", ".join(unrecognized[u]))

# list ranking
dictionary.sort(key=lambda entry:-entry.get("use", 0))
for i, entry in enumerate(dictionary):
    entry["rk"] = i + 1
dictionary.sort(key=lambda entry:entry["id"])

with open("resources/js/generated/dict.js", "w") as f:
    print("writing dictionary file:", len(dictionary), "entries")
    f.write("const corpus_usage_all = " + str(alluses) + "\n")
    f.write("const dictionary = " + json.dumps(dictionary, indent = 2))