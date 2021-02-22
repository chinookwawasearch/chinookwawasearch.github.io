makeset = (l) => { return new Set(l); }

// fuse search
const fuse_gloss = new Fuse(
    dictionary,
    {
        includeScore: true,
        ignoreLocation: true,
        keys: ['fuse-gloss']
    }
)

function normalize(a) { return a.normalize() }

const none=null