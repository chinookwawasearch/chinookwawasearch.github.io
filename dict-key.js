const orthography_legend = {
    "qw": "q'alis wawa's hobbyist orthography",
    "lj": "lusentoj's hobbyist orthography",
    "pp": "Duployan / Chinuk Pipa (e.g. Kamloops Wawa) romanization",
    "dr": "Dave Roberts' orthography (Deiv Pipa)",
    "gr": "Grand Ronde"
}

const orthography_full = {
    "qw": "qw",
    "lj": "lj",
    "pp": "cp",
    "dr": "ddr",
    "gr": "gr"
}

const orthography_color = {
    "qw": "gray",
    "lj": "#77a38a",
    "pp": "#9a7bb3", // purplish
    "dr": "#8B4513", // sienna
    "gr": "#DB9C45" // yellow-orange
}

const tag_color = {
    "Compound": "#80C7F0",
    "Limited": "#d6b547",
    "Dubious": "#AC2E2E",
    "Uncited": "#aaba84",
    "Neologism": "#3d85c6",
    "Archaic": "#A686CD",
    "KW/Northern": "#4DAD60",
    "GR/Southern": orthography_color["gr"],
}

const tag_description = {
    "Compound": "This is a compound word, comprising two or more \"simple\" words.",
    "Limited": "This word had limited or regional usage.",
    "Dubious": "The meaning, pronunciation, and usage of this word are uncertain or poorly-attested.",
    "Uncited": "Entry lacks a non-hobbyist source.",
    "Neologism": "This word was invented by a modern CW community.",
    "Archaic": "This word was used mainly by early speakers of CW.",
    "KW/Northern": "This word may be specific to Northern (British Columbia) CW, or perhaps specifically Kamloops Wawa.",
    "GR/Southern": "This word is specific to Grand Ronde/creolized CW.",
}

const source_legend = {
    "Zenk": {
        "display": "Zenk 2010",
        "author": "Zenk, Henry et. al.",
        "name": "Chinuk Wawa etymologies",
        "date": "2010",
        "tag": "gr", // grand ronde
        "href": "http://lingpapers.sites.olt.ubc.ca/files/2018/02/2010_Zenk_Johnson_Hamilton.pdf"
    },
    "Grand Ronde": {
        "display": "Grand Ronde",
        "author": "The Confederated Tribes of the Grand Ronde Community of Oregon",
        "name": "Chinuk Wawa: kakwa nsayka ulman-tilixam laska munk-kemteks nsayka",
        "date": "2012",
        "tag": "gr", // grand ronde
        "href": "https://www.amazon.com/Chinuk-Wawa-nsayka-ulman-tilixam-munk-kemteks/dp/0295991860"
    },
    "Lang": {
        "display": "Lang 2008",
        "author": "Lang, George",
        "name": "Making Wawa: The Genesis of Chinook Jargon",
        "date": "2008",
        "tag": "gr" // grand ronde
    },
    "App": {
        "display": "Grand Ronde (App)",
        "author": "The Confederated Tribes of the Grand Ronde Community of Oregon",
        "name": "Chinuk Wawa (App Store)",
        "tag": "gr", // grand ronde
        "href": "https://apps.apple.com/us/app/chinuk-wawa/id908108231"
    },
    "Holton": {
        "display": "Holton 1999",
        "author": "Holton, R J",
        "name": "Chinook Jargon: The Hidden Language of the Pacific Northwest",
        "date": "1999",
        "href": "http://rjholton.com/"
    },
    "Gibbs": {
        "display": "Gibbs 1863",
        "author": "Gibbs, George",
        "name": "Dictionary of the Chinook Jargon, or Trade Language of Oregon",
        "date": "1863"
    },
    "Gill": {
        "display": "Gill 1909",
        "author": "Gill, John Kaye",
        "name": "Gill's Dictionary of the Chinook Jargon",
        "date": "1909",
        "href": "https://www.google.com/books/edition/Gill_s_Dictionary_of_the_Chinook_Jargon/1xsOAAAAIAAJ?hl=en&gbpv=1&dq=pee+Mahlee+konaway+nesika+mesahchee&pg=PA84&printsec=frontcover"
    },
    "Hibbens": {
        "display": "Hibbens 1889",
        "author": "Hibbens, T. N.",
        "name": "Dictionary of the Chinook Jargon, or Indian Trade Language of the North Pacific Coast",
        "date": "1889",
        "href": "https://www.gutenberg.org/files/35492/35492-h/35492-h.htm"
    },
    "Shaw": {
        "display": "Shaw 1909",
        "author": "Shaw, George Coombs",
        "name": "The Chinook Jargon and how to Use it: A Complete and Exhaustive Lexicon of the Oldest Trande Language of the American Continent",
        "date": "1909",
        "href": "https://books.google.ca/books/about/The_Chinook_Jargon_and_how_to_Use_it.html?id=8bUUAAAAYAAJ&redir_esc=y"
    },
    "Swan": {
        "display": "Swan 1857",
        "author": "Swan, James",
        "name": "The Northwest Coast",
        "date": "1857"
    },
    "Lionnet": {
        "display": "Lionnet 1857",
        "author": "Swan, James",
        "name": "The Northwest Coast",
        "date": "1857"
    },
    "Powell 1985": {
        "display": "Powell 1985",
        "author": "Powell, J. V.",
        "name": "Chinook Jargon Words the Lexicographers Left Out",
        "date": "1985",
        "href": "https://lingpapers.sites.olt.ubc.ca/files/2018/03/1985_PowellU.pdf"
    },
    "Powell 1990": {
        "display": "Powell 1990",
        "author": "Powell, J. V.",
        "name": "Chinook Jargon Vocabulary and the Lexicographers",
        "date": "1990",
        "href": "https://www.jstor.org/stable/1265446?seq=1"
    },
    "Powell 2019": {
        "display": "Powell 2019",
        "author": "Sullivan, Sam & Powell, J. V.",
        "name": "Jay Powell interviewed by Sam Sullivan in Chinook Wawa",
        "date": "2019",
        "href": "https://www.youtube.com/watch?v=V9fmkZHm_-Q"
    },
    "Demers": {
        "display": "Demers 1871",
        "author": "Demers, Modeste",
        "name": "Chinook Dictionary, Catechism, Prayers, and Hymns",
        "date": "1871"
    },
    "Palmer": {
        "display": "Palmer 1847",
        "author": "Palmer, Joel",
        "name": "Palmer's Journal of travels over the Rocky Mountains, to the Mouth of the Columbia River",
        "date": "1847",
        "href": "https://archive.org/stream/palmersjournalof00palmrich#page/n9/mode/2up/search/chinook+jargon"
    },
    "Ross": {
        "display": "Ross 1849",
        "author": "Ross, Alexander",
        "name": "Adventures of the First Settlers on the Oregon or Columbia River",
        "date": "1849"
    },
    "Boas": {
        "display": "Boas 1892",
        "author": "Boas, Franz",
        "name": "The Chinook Jargon",
        "date": "1892"
    },
    "Schoolcraft": {
        "display": "Schoolcraft 1853",
        "author": "Schoolcraft, Henry Rowe",
        "name": "The Columbian",
        "date": "1853",
        "href": "https://chinookjargon.com/2018/11/18/the-columbian-line-the-ultimate-in-sw-washington-chinuk-wawa/"
    },
    "Dave 2000": {
        "display": "Davis & Robertson 2000",
        "name": "\"Fox and Cayooty\": an early St'át'imcets-Chinook Jargon bilingual text",
        "date": "2000",
        "author": "Davis, Henry & Robertson, Dave",
        "href": "https://lingpapers.sites.olt.ubc.ca/files/2018/03/2000_Davis_Robertson.pdf"
    },
    "Dave 2018": {
        "display": "Robertson 2018",
        "name": "P.S.: more Lower Chehalis loans in Chinook Jargon, and ɬəw̓ál̓məš revitalization",
        "date": "2018",
        "author": "Robertson, Dave",
        "href": "https://lingpapers.sites.olt.ubc.ca/files/2018/01/16-Robertson_ICSNL_final-34.pdf"
    },
    "Woodcock": {
        "display": "Woodcock 1952",
        "author": "Woodcock, Myrtle",
        "date": "1952",
        "name": "Myrtle Woodcock Speaks Chinook Language 1952",
        "href": "https://www.youtube.com/watch?v=nBy8fY06TdA"
    },
    "lusentoj": {
        "display": "(lusentoj)",
        "author": "lusentoj",
        "name": "lusentoj's hobbyist dictionary",
        "date": "2020",
        "tag": "h", // hobbyist
    },
    "OrthodoxFox": {
        "display": "(OrthodoxFox)",
        "author": "OrthodoxFox",
        "name": "OrthodoxFox's hobbyist dictionary",
        "date": "2020",
        "tag": "h", // hobbyist
    },
    "q́alis": {
        "display": "(q́alis)",
        "author": "q́alis",
        "name": "q́alis's hobbyist dictionary (draft)",
        "date": "2020",
        "tag": "h", // hobbyist
    },
    "qw": {
        "display": "(q'alis wawa)",
        "author": "q'alis wawa",
        "name": "q'alis wawa's hobbyist dictionary",
        "date": "2020",
        "tag": "h", // hobbyist
    }
}