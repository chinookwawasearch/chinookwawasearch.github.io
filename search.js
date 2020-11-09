const vowels = new Set("aeuijoyə")

// cost to substitute any letter in a set for any other letter in the same set.
// followed by optional cost to create a letter in the given set
// 1 is the max.
const transitions = [
    // spaces and dashes
    [new Set(["-", " "]), .2, 0.4],

    // vowels
    [new Set(["oo"]), 0, 1], // oo is the most costly vowel to insert / least likely to be an error.
    [new Set(["oo", "u"]), .2],
    [new Set("iy"), .1, .5],
    [new Set("iyj"), .4], // (squints nervously)
    [new Set("eəi"), .3, .4],
    [new Set("eəu"), .4, .4],
    [new Set("eəa"), .4, .4],
    [new Set("aeijyə"), .5, .5],

    // fricatives
    [new Set(["tl", "kl", "ɬ"]), .05],
    [new Set(["tz", "ts"]), .05],
    [new Set(["s", "z", "ss"]), .05],
    [new Set(["s", "z", "ss", "sh", "ts", "tz", "c"]), .3],

    // plosives
    [new Set(["p", "pʰ"]), .05],
    [new Set(["b", "p", "f", "v"]), .35],

    [new Set(["tʰ", "t"]), .05],
    [new Set(["t", "d"]), .35],

    [new Set(["kʰ", "k", "ck"]), .05],
    [new Set(["qʰ", "q"]), .05],
    [new Set(["k", "q", "ck"]), .1],
    [new Set(["k", "q", "c", "g", "ck"]), .23],

    // these are sometimes the same sound..?
    [new Set(["ch", "j", "sh", "ts", "tz"]), .7],

    // wh/hw/w
    [new Set(["hw", "wh"]), .1, 0.4],
    [new Set(["hw", "wh", "w"]), .5, 0.3],

    // r/l
    [new Set("r"), 0, 0.8], // r can appear/disappear in orthographies quite easily...
    [new Set(["r", "l", "ll"]), .2],

    // glottal
    [new Set("ʔ?'7"), .05, 0.1], // these can appear/disappear quite easily

    // aspiration
    [new Set(["x", "h", "kh", "gh", "ʰ"]), .2, 0.75], // these can disappear occasionally

    // any vowels
    [vowels, 0.75, 0.75]

    // [everything else, 1, 1]
]

transition_matrix = []
transition_matrix_idx = {
    '': 0
}

function regularize_transitions() {
    // regularize the distance metric for the transition function
    // (add in any missing 'shortcut' transitions)
    // (constructs the nxn transition_matrix)

    // accumulate all letters / digraphs
    var _letters = new Set()
    for (var i = 0; i < transitions.length; ++i)
    {
        var s = transitions[i][0];
        for (var it = s.values(), val= null; val=it.next().value; )
        {
            _letters.add(val);
        }
    }

    var s = _letters;
    letters = [null]
    for (var it = s.values(), val= null; val=it.next().value; )
    {
        transition_matrix_idx[val] = letters.length;
        letters.push(val)
    }

    // initialize transition matrix.
    for (var i = 0; i < letters.length; ++i)
    {
        var r = []
        for (var j = 0; j < letters.length; ++j)
        {
            // naive distance
            r.push(distance_char(letters[i], letters[j]));
        }
        transition_matrix.push(r)
    }

    // Floyd-Warshal (all-pairs shortest path)
    for (var k = 0; k < letters.length; ++k)
    {
        for (var i = 0; i < letters.length; ++i)
        {
            for (var j = 0; j < letters.length; ++j)
            {
                if (transition_matrix[i][k] + transition_matrix[k][j] < transition_matrix[i][j])
                {
                    transition_matrix[i][j] = transition_matrix[i][k] + transition_matrix[k][j]
                }
            }
        }
    }
}

const digraphs = new Set([
    "ss",
    "ll",
    "ck",
    "sh",
    "ch",
    "tl",
    "kl",
    "ts",
    "tz",
    "wh",
    "hw",
    "kh",
    "gh",
    "pʰ",
    "tʰ",
    "kʰ",
    "qʰ",
    "oo"
])

function distance_char_exp(a, b) {
    // faster version of distance_char, but requires transition_matrix to be initialized.
    if (a == b) return 0;
    if (a != null)
    {
        a = latinize(a.normalize()).toLowerCase();
    }
    if (b != null)
    {
        b = latinize(b.normalize()).toLowerCase();
    }
    if (a == b) return 0.03; // what's this? just a penalty for requiring that normalization... very tiny..... pretty much only matters for exact matches. (looking at you, skokúm)

    // look up a, b in transition matrix
    a_idx = transition_matrix_idx[a];
    b_idx = transition_matrix_idx[b];
    if (!a_idx) a_idx = 0;
    if (!b_idx) b_idx = 0;
    return transition_matrix[
        a_idx
    ][
        b_idx
    ]
}

function distance_char(a, b) {
    if (a == b) return 0;
    if (a != null)
    {
        a = latinize(a.normalize()).toLowerCase();
    }
    if (b != null)
    {
        b = latinize(b.normalize()).toLowerCase();
    }
    if (a == null || b == null) {
        if (a == null) return distance_char(b, a)

        // insert/delete cost.
        for (var i = 0; i < transitions.length; ++i)
        {
            var transition = transitions[i];
            if (transition[0].has(a) && transition.length >= 3)
            {
                return transition[2];
            }
        }
    }
    else
    {
        // swap cost
        for (var i = 0; i < transitions.length; ++i)
        {
            var transition = transitions[i];
            if (transition[0].has(a) && transition[0].has(b))
            {
                return transition[1];
            }
        }
    }
    
    // default.
    return 1;
}

function matrix(a, b) {
    var m = []
    for (var i = 0; i < a; ++i)
    {
        var r = []
        for (var j = 0; j < b; ++j)
        {
            r.push(0)
        }
        m.push(r)
    }
    return m
}

// sets the i,jth entry of the matrix
// assumes i-1,j; i,j-1; and i-1,j-1 entries are correct (if applicable)
function dist_strings_h(m, a, b, i, j) {
    if (i == 0 && j == 0) return 0;

    s = []

    // weighted Levenshtein distance
    if (i > 0)
        s.push(m[i - 1][j] + distance_char_exp(a[i - 1], null))

    if (j > 0)
        s.push(m[i][j - 1] + distance_char_exp(b[j - 1], null))

    if (i > 0 && j > 0)
        s.push(m[i - 1][j - 1] + distance_char_exp(a[i - 1], b[j - 1]))

    return Math.min.apply(null, s)
}

function tokenize(s) {
    var out = []
    for (var i = 0; i < s.length; ++i)
    {
        var  c = s[i];

        // substitutions
        if (c == "ʔ" || c == "Ɂ") c = "7"
        if (/\s/.test(c) || c == "-") c = " "
        
        // digraphs
        if (i < s.length - 1)
        {
            var di = s.slice(i, i+2);
            if (digraphs.has(di))
            {
                out.push(di)
                i++;
                continue;
            }
        }
        
        // monograph
        out.push(c)
    }

    return out;
}

function dist_strings(a, b) {

    a = tokenize(a);
    b = tokenize(b);

    var m = matrix(a.length + 1, b.length + 1)
    for (var i = 0; i < a.length + 1; ++i)
    {
        for (var j = 0; j < b.length + 1; ++j)
        {
            m[i][j] = dist_strings_h(m, a, b, i, j)
        }
    }

    return m[a.length][b.length]
}

function dissimilarity_strings(a, b)
{
    return dist_strings(a, b) / Math.max(0.1, dist_strings(a, '') + dist_strings(b, ''))
}

function printd(a, b) {
    var d = dist_strings(a, b);
}

function search(a) {
    matches = []
    var mindex = 0
    for (var i = 0; i < dictionary.length; ++i)
    {
        entry = dictionary[i]
        var d = 1;
        for (var j = 0; j < entry["cw"].length; ++j)
        {
            // get best match of available options.
            compare = entry["cw"][j]["value"]
            var _d = dissimilarity_strings(a, compare);
            if (_d < d) d = _d;
        }
        if (d < 0.28) mindex++;
        matches.push(
            {
                entry_idx: i,
                entry: dictionary[i],
                dissimilarity: d
            }
        );
    }

    matches.sort(function(a, b) {
        return a.dissimilarity - b.dissimilarity;
    })

    return matches.slice(0, Math.min(15, mindex))
}

// patch up the partially-defined distance metric <3 <3 :) :3 <3
regularize_transitions();

// precompute dissimilarities
/*
dissimilarities = []
for (var i = 0; i < dictionary.length; ++i)
{
    for (var j = i + 1; j < dictionary.length; ++j)
    {
        dissimilarities.push(dissimilarity_strings(dictionary[i], dictionary[j]))
    }
}
dissimilarities.sort()
*/