# retrieves dictionary sources from various sources on the web.

import os
import json
import sys
import pickle
import urllib.request
import re
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
        with open("sources/qw_credentials.json", "w") as f:
            json.dump(secret["qw"]["credentials"], f)
        # The file token.pickle stores the user's access and refresh tokens, and is
        # created automatically when the authorization flow completes for the first
        # time.
        creds = None
        if os.path.exists('sources/qw-token.pickle'):
            with open('sources/qw-token.pickle', 'rb') as token:
                creds = pickle.load(token)
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file('sources/qw_credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open('sources/qw-token.pickle', 'wb') as token:
                pickle.dump(creds, token)
        g_service = build('sheets', 'v4', credentials=creds)
        return g_service


# download qalis.ods
def qw_retrieve():
    sheet = get_service().spreadsheets()

    src_words="'Simple Words'"
    src_compounds="'Compounds'"

    result = sheet.get(spreadsheetId=secret["qw"]["sheet-id"], ranges=[src_words, src_compounds], includeGridData=True).execute()
    rows = [
        result["sheets"][i]["data"][0]["rowData"] for i in range(2)
    ]

    simp = []
    comp = []
    for i in range(2):
        for row in rows[i][5:]:
            itemtext = [item["effectiveValue"]["stringValue"] if "effectiveValue" in item and "stringValue" in item["effectiveValue"] else "" for item in row["values"]]
            itembg = [item["effectiveFormat"]["backgroundColor"] if "effectiveFormat" in item and "backgroundColor" in item["effectiveFormat"] else dict() for item in row["values"]]

            if i == 0:
                # simple word
                obj = {
                    "gloss": itemtext[0],
                    "cw-qw": itemtext[1],
                    "cw-practical": itemtext[2],
                    "cw-attested": itemtext[3],
                    "cw-duployan": itemtext[4],
                    "origin-language": itemtext[5],
                    "origin-word": itemtext[6],
                    "source-gr": itemtext[7],
                    "source-d1": itemtext[8],
                    "source-d2": itemtext[9],
                    "source-alt": itemtext[10:17],
                    "colour-attest": itembg[1],
                    "colour-source": itembg[5],
                    "compound": False
                }
                
                simp += [obj]
            else:
                # compound word
                obj = {
                    "gloss": itemtext[0],
                    "cw-qw": itemtext[1],
                    "cw-attested": itemtext[2],
                    "cw-practical": "",
                    "cw-duployan": "",
                    "origin-language": "",
                    "origin-word": "",
                    "source-gr": itemtext[3],
                    "source-d1": itemtext[4],
                    "source-d2": "",
                    "source-alt": itemtext[11:18],
                    "colour-attest": itembg[1],
                    "colour-source": dict(),
                    "compound": True
                }

                comp += [obj]
    
    with open("sources/qw_simp.json", "w") as f:
        json.dump(simp, f)
    with open("sources/qw_comp.json", "w") as f:
        json.dump(comp, f)

def qw_retrieve_cited():
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
                                print("accessing", source)
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
                                print(source)
                            if obj != None:
                                dictmap[source] = obj
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

# uncomment this to retrieve from QW
# qw_retrieve()
# qw_retrieve_cited()

# uncomment this to retrieve from lusentoj
#lj_retrieve()
