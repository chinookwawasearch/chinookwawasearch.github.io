# retrieves dictionary sources from various sources on the web.

import os
import json
import sys
import pickle
import urllib.request
import re
import wget

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

# json
try:
    with open("secret.json") as f:
        secret = json.load(f)
except Exception as e:
    print("secret.json is required.")
    raise (e)

# create sources directory if none exists.
if not os.path.exists('sources'):
    os.makedirs('sources')

# retrieve google sheets service
g_service = None
def get_service():
    global g_service
    if g_service is not None:
        return g_service
    else:
        # https://googleapis.github.io/google-api-python-client/docs/epy/index.html
        print("building Google Sheets API service...")
        g_service = build('sheets', 'v4', developerKey=secret["qw"]["key"])
        print("done.")
        return g_service

def convert_to_deiv_pipa(text):
    assert(type(text) == type(""))
    text = text.replace("x", "h\u0331")
    text = text.replace("q", "k\u0331")
    return text

# download qalis.ods
def qw_retrieve():
    sheet = get_service().spreadsheets()

    src_words="'Simple Words'"
    src_compounds="'Compounds'"

    print("retrieving sheet data (q'alis)...")
    result = sheet.get(spreadsheetId=secret["qw"]["sheet-id"], ranges=[src_words, src_compounds], includeGridData=True).execute()
    print("complete.")
    rows = [
        result["sheets"][i]["data"][0]["rowData"] for i in range(2)
    ]
    print("done.")

    DATA_ROWS_BEGIN = 5
    HEADER_ROW = 4

    def row_content(row):
        return [item["effectiveValue"]["stringValue"] if "effectiveValue" in item and "stringValue" in item["effectiveValue"] else "" for item in row["values"]]

    simp = []
    comp = []
    for i in range(2):
        header = [h.lower().strip() for h in row_content(rows[i][HEADER_ROW])]
        if i == 0:
            COL_GLOSS = header.index("english gloss")
            COL_CLUB = header.index("club")
            COL_PRACTICAL = header.index("practical")
            COL_ATTESTED = header.index("attested spellings")
            COL_DUPLOYAN = header.index("duployan")
            COL_GEN = header.index("general")
            COL_WORD = header.index("word {language}")
            COL_GR = header.index("grand ronde")
            COL_D1 = header.index("dictionary/book 1")
            COL_D2 = header.index("dictionary/book 2")
            COL_ALTSTART = header.index("others:")
            COL_ALTEND = COL_ALTSTART + 7
        else:
            COL_GLOSS = header.index("english gloss")
            COL_CW = header.index("chinuk wawa")
            COL_ATTESTED = header.index("attested spellings")
            COL_GR = header.index("grand ronde")
            COL_DB = header.index("dictionary, book")
            COL_ALTSTART = header.index("other")
            COL_ALTEND = COL_ALTSTART + 7

        for row in rows[i][DATA_ROWS_BEGIN:]:
            itemtext = row_content(row)
            itembg = [item["effectiveFormat"]["backgroundColor"] if "effectiveFormat" in item and "backgroundColor" in item["effectiveFormat"] else dict() for item in row["values"]]

            if i == 0:
                # simple word
                obj = {
                    "gloss": itemtext[COL_GLOSS],
                    "cw-qw": itemtext[COL_CLUB],
                    "cw-practical": convert_to_deiv_pipa(itemtext[COL_PRACTICAL]),
                    "cw-attested": itemtext[COL_ATTESTED],
                    "cw-duployan": itemtext[COL_DUPLOYAN],
                    "origin-language": itemtext[COL_GEN],
                    "origin-word": itemtext[COL_WORD],
                    "source-gr": itemtext[COL_GR],
                    "source-d1": itemtext[COL_D1],
                    "source-d2": itemtext[COL_D2],
                    "source-alt": itemtext[COL_ALTSTART:COL_ALTEND],
                    "colour-attest": itembg[COL_CLUB],
                    "colour-source": itembg[COL_GEN],
                    "compound": False
                }
                
                simp += [obj]
            else:
                # compound word
                obj = {
                    "gloss": itemtext[COL_GLOSS],
                    "cw-qw": itemtext[COL_CW],
                    "cw-attested": itemtext[COL_ATTESTED],
                    "cw-practical": "",
                    "cw-duployan": "",
                    "origin-language": "",
                    "origin-word": "",
                    "source-gr": itemtext[COL_GR],
                    "source-d1": itemtext[COL_DB],
                    "source-d2": "",
                    "source-alt": itemtext[COL_ALTSTART:COL_ALTEND],
                    "colour-attest": itembg[COL_CW],
                    "colour-source": dict(),
                    "compound": True
                }

                comp += [obj]
    
    with open("sources/qw_simp.json", "w") as f:
        json.dump(simp, f)
    with open("sources/qw_comp.json", "w") as f:
        json.dump(comp, f)

def qw_retrieve_cited():
    print("retrieving Q'alis' citation data...")
    re_cj_title = re.compile('<meta property="og:title"\s*content="(.*)"\s*/>')
    re_cj_date =  re.compile('<meta property="article:published_time"\s*content="(.*)T.*"\s*/>')
    dictmap = dict()
    for path in ["sources/qw_simp.json", "sources/qw_comp.json"]:
        with open(path, "r") as f:
            source = json.load(f)
            for entry in source:
                for source in [entry["source-gr"], entry["source-d1"], entry["source-d2"]] + entry["source-alt"]:
                    if source not in dictmap:
                        if source.startswith("http"):
                            obj = None
                            if source == "https://lingpapers.sites.olt.ubc.ca/files/2018/01/16-Robertson_ICSNL_final-34.pdf":
                                obj = "Dave 2018"
                            elif source == "https://lingpapers.sites.olt.ubc.ca/files/2018/03/2000_Davis_Robertson.pdf":
                                obj = "Dave 2000"
                            elif source.startswith("https://www.jstor.org/stable/1265446?"):
                                obj = "Powell 1990"
                            elif source == "http://www.native-languages.org/morelegends/seatco.htm":
                                pass # ignore
                            elif source == "https://www.youtube.com/watch?v=V9fmkZHm_-Q":
                                obj = "Powell 2019"
                            elif source == "https://lingpapers.sites.olt.ubc.ca/files/2018/03/1985_PowellU.pdf":
                                obj = "Powell 1985"
                            elif source == "https://www.youtube.com/watch?v=nBy8fY06TdA":
                                obj = "Woodcock"
                            elif source.startswith("https://chinookjargon.com"):
                                # access
                                contents = urllib.request.urlopen(source).read().decode("utf-8") 
                                title = re_cj_title.search(contents)
                                date = re_cj_date.search(contents)
                                if title is not None and date is not None:
                                    obj = {
                                        "display": "chinookjargon.com",
                                        "author": "Dave Robertson",
                                        "date": date.group(1),
                                        "name": "Chinook Jargon, \"<i>" + title.group(1) + "</i>\"",
                                        "href": source,
                                        "tag": "cj"
                                    }
                                else:
                                    print("Failed to parse article at", source)
                                    obj = {
                                        "display": "chinookjargon.com",
                                        "author": "Dave Robertson",
                                        "name": "Chinook Jargon",
                                        "href": source
                                    }
                            else:
                                obj = {
                                    "display": "(other)",
                                    "name": "(web)",
                                    "href": source
                                }
                            if obj != None:
                                dictmap[source] = obj
    print("done.")
    with open("sources/qw_cited_map.json", "w") as f:
        json.dump(dictmap, f)

def lj_retrieve():
    sheet = get_service().spreadsheets()

    src_sheet="'chinuk'"

    result = sheet.get(spreadsheetId=secret["lj"]["sheet-id"], ranges=[src_sheet], includeGridData=True).execute()
    rowData = result["sheets"][0]["data"][0]["rowData"]
    words = []
    for row in rowData:
        if "values" in row:
            cells = row["values"]
            text = [cell["effectiveValue"]["stringValue"] if "effectiveValue" in cell and "stringValue" in cell["effectiveValue"] else "" for cell in cells]
            if len(text) >= 3:
                obj = {
                    "cw": text[0],
                    "notes": text[1],
                    "gloss": text[2]
                }
                words.append(obj)

    with open("sources/lj.json", "w") as f:
        json.dump(words, f)

def snass_retrieve():
    os.makedirs("./sources/snass/", exist_ok=True)
    with open("./resources/data/snass_sessions.json") as f:
        sessions = json.load(f)
    i = 0
    for session in sessions:
        if session["url"] != "":
            path="./sources/snass/snass" + str(i) + ".pdf"
            if os.path.exists(path):
                os.remove(path)
            wget.download(session["url"], out=path)
            i += 1


try:
    f = open("./retrieve.json")
    retrievelist = json.load(f)
except IOError:
    retrievelist = ["qw", "qw-cited", "english", "snass"]
finally:
    f.close()

if "english" in retrievelist:
    if not os.path.exists("sources/words_dictionary.json"):
        wget.download("https://github.com/dwyl/english-words/raw/master/words_dictionary.json", out="sources")
if "qw" in retrievelist:
    qw_retrieve()
if "qw-cited" in retrievelist:
    qw_retrieve_cited()
if "lj" in retrievelist:
    lj_retrieve()
if "snass" in retrievelist:
    snass_retrieve()