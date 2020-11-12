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
    [new Set("eəua"), .4, .4],
    [new Set("aeijyə"), .5, .5],

    // this is rare, but happens.
    [new Set(["m", "n"]), .65],

    // fricatives
    [new Set(["tl", "ɬ"]), .03],
    [new Set(["kl", "ɬ"]), .04],
    [new Set(["tz", "ts"]), .05],
    [new Set(["s", "z", "ss"]), .05],
    [new Set(["s", "z", "ss", "sh", "ts", "tz", "c"]), .6],

    // for simps who can't type the lateral fricative,
    // and to soften the transition to some older victorian-era spelling styles e.g. hl, cl
    [new Set("ɬl"), 0.44],

    // plosives
    [new Set(["p", "pʰ"]), .05],
    [new Set(["b", "p", "f", "v"]), .35],

    [new Set(["tʰ", "t"]), .05],
    [new Set(["t", "d"]), .25],

    [new Set(["kʰ", "k", "ck"]), .05],
    [new Set(["qʰ", "q"]), .05],
    [new Set(["k", "q", "ck"]), .1],
    [new Set(["k", "q", "c", "g", "ck"]), .23],

    // these are sometimes the same sound..?
    [new Set(["ch", "ts"]), .35],
    [new Set(["ch", "j", "sh", "ts", "tz"]), .7],
    [new Set(["ch", "k"]), .55],
    [new Set(["ch", "ck", "q"]), .76],

    // wh/hw/w
    [new Set(["hw", "wh"]), .1, 0.4],
    [new Set(["hw", "wh", "w"]), .5, 0.3],

    // r/l
    [new Set("r"), 0, 0.8], // r can appear/disappear in orthographies quite easily...
    [new Set(["l", "ll"]), .1],
    [new Set(["r", "l", "ll"]), .2],

    // glottal
    [new Set("ʔ?'7"), .05, 0.1], // these can appear/disappear quite easily

    // digraph regularization (softens the blow for a missing letter in a digraph)
    [new Set(["tl", "l", "kl"]), .8],
    [new Set(["tl", "t"]), .6],
    [new Set(["kl", "k"]), .6],
    [new Set(["ts", "t"]), .3],
    [new Set(["gh", "g"]), .3],
    [new Set(["kh", "s"]), .2],
    [new Set(["o", "oo"]), .3],
    [new Set(["t"]), 0, 0.7], // this helps with tɬ <-> kl 

    // aspiration
    [new Set("Χxχ"), 0], // these other letters sometimes used for x.
    [new Set(["x", "h", "kh", "gh", "ʰ"]), .2, 0.75], // these can disappear occasionally
    [new Set(["x", "h", "kh", "gh", "k"]), 0.62], // 'k' for 'x' is an archaic thing [stik-swakik]

    // any vowels
    [vowels, 0.62, 0.75]

    // [everything else, 1, 1]
]

transition_matrix = []
transition_matrix_idx = {
    '': 0
}

function replace_transition(a, b, v) {
    idx_a = transition_matrix_idx[a];
    idx_b = transition_matrix_idx[b];
    transition_matrix[idx_a][idx_b] = v;
    transition_matrix[idx_b][idx_a] = v;
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

    // make some adjustments that break the distance metric, but are sensible anyway.
    replace_transition("kl", "t", 1);
    replace_transition("tl", "k", 1);
    replace_transition("tl", "l", 0.9);
    replace_transition("kl", "l", 0.9);
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
    if (a == null || a == '') a_idx = 0;
    else if (!a_idx) return 1;
    if (b == null || b == '') b_idx = 0;
    else if (!b_idx) return 1;
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

    // already tokenized, presumably.
    if (typeof s !== "string") return s;

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

// fuse search
const fuse_gloss = new Fuse(
    dictionary,
    {
        includeScore: true,
        ignoreLocation: true,
        keys: ['fuse-gloss']
    }
)

function search_gloss(a, cb) {

    setTimeout(function() {
        var matches = []
        // TODO: fuse doesn't offer asynch search. Also it's not quite right for this task anyway...
        var results = fuse_gloss.search(a);
        for (var i = 0; i < results.length; ++i)
        {
            var result = results[i]
            if (result.score < 0.3)
            {
                matches.push(
                    {
                        entry: result.item,
                        entry_idx: result.refIndex,
                        dissimilarity: result.score
                    }
                )
            }
        }

        cb(matches);
    }, 25);
}

function search_tick(acc)
{
    if (acc.abort)
    {
        console.log("search aborted.")
        return;
    }
    for (const iend = acc.i + acc.chunksize; acc.i < dictionary.length && acc.i < iend; ++acc.i)
    {
        const entry = dictionary[acc.i]
        var d = 1;

        // get best match of available options.
        for (var j = 0; j < entry["cw"].length; ++j)
        {
            compare = entry["cw"][j]["value"]
            var _d = dissimilarity_strings(acc.tokenized, compare);
            if (_d < d) d = _d;
        }

        // push best match if it passes the threshold
        if (d < 0.305) acc.mindex++;
        acc.matches.push(
            {
                entry_idx: acc.i,
                entry: dictionary[acc.i],
                dissimilarity: d
            }
        );
    }
    if (acc.i < dictionary.length)
    {
        // continue next tick
        setTimeout(
            function() {search_tick(acc);},
            0
        );
    }
    else
    {
        // complete.
        acc.matches.sort(function(a, b) {
            return a.dissimilarity - b.dissimilarity;
        })

        acc.cb(acc.matches.slice(0, Math.min(15, acc.mindex)))
    }
}

function search(a, cb) {
    tokenized = tokenize(a);
    chunksize = Math.floor(Math.max(10, 250 / Math.max(1, tokenized.length)));

    var accumulator = {
        term: a,
        tokenized: tokenized,
        matches: [],
        mindex: 0,
        i: 0,
        // number of entries to process per tick
        chunksize: chunksize,
        cb: cb,
        abort: false
    }

    search_tick(accumulator);

    return function()
    {
        accumulator.abort = true;
    }
}

function search_both(a, cb)
{
    // combine both results
    return search(a, function(matches)
    {
        search_gloss(a, function(_matches) {
            matches.push.apply(matches, _matches);

            // sort by match quality
            matches.sort(function(a, b) {
                return a.dissimilarity - b.dissimilarity;
            })

            // remove duplicate
            matches.filter(function(item, pos) {
                return matches.findIndex(function(uitem) {
                    return item.entry == uitem.entry
                }) == pos;
            })

            cb(matches)
        })
    })
}

// patch up the partially-defined distance metric <3 <3 :) :3 <3
regularize_transitions();

console.log(distance_char_exp("kl", ""))

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