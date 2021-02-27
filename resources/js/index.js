var gid_it = 0

// entries must be at least this rude to be marked with "caution"
const caution_tag_default = 2;
var caution_tag = caution_tag_default;

// entries must be at least this rude to be hidden by default
const caution_hide_default = 3;
const caution_hide_max = 6;
var caution_hide = caution_hide_default;

// caution_hide must be at least this in order to show rudegloss entries
const caution_show_rudegloss = 4;

// show rude entries in gloss
var show_rudegloss = false;

var entry_details = null;

const corpus_disclaimer = "<i>A corpus of Chinuk Wawa texts and transcriptions is being collected for this dictionary. Please note that it is still very small, very much a work in progress, and largely based on northern dialect Chinuk Wawa. Currently, only Dave Robertson's \"Snass sessions\" appear in the corpus. Furthermore, note that the information shown here is machine-identified not verified by a human.</i>"

function ordinal(number)
{
    if (number != Math.floor(number)) return "th";
    switch(number % 10)
    {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default:
        return "th"
    }
}

function superordinal(number)
{
    o = ordinal(number)
    return `<sup>${o}</sup>`
}

function plural(word, count, uword)
{
    if (uword == undefined) uword = word + "s"
    return (count == 1) ? word : uword
}

function sigfigs(v, p)
{
    let k = 1;
    let digit = 0;
    let s = ""
    while (k <= v) {
        k *= 10;
        digit += 1;
    }
    while (k > v) {
        v *= 10;
        digit -= 1;
    }
    if (digit < 0)
    {
        s = "0.";
        for (var i = 1; i < -digit; ++i)
        {
            s += "0"
        }
    }
    for (var i = 0; i < p; ++i)
    {
        s += (Math.floor(v / k) % 10)
        v *= 10;
        if (i != p - 1 && digit == 0)
        {
            s += "."
        }
        digit--;
    }
    return s
}

function orthkey_html(orth)
{
    if (orth != "")
    {
        legend = orthography_legend[orth]
        style = orthography_color[orth]
        orthr = orthography_full[orth]
        return `<sup class="orthkey" style="color:${style};">[<abbr title="${legend}">${orthr}</abbr>]</sup>`
    }
    return ""
}

function display_cwtext(cwtext)
{
    return cwtext
        .replace(/k\u0331/g, "<u>k</u>")
        .replace(/h\u0331/g, "<u>h</u>")
}

function manipulate_entry(entry)
{
    if (entry["rude"] !== undefined)
    {
        if (entry["rude"] >= caution_tag)
        {
            if (entry["tags"] !== undefined)
            {
                entry["tags"].push("Caution");
            }
            else
            {
                entry["tags"] = ["Caution"];
            }
        }

        if (entry["rude"] >= caution_hide)
        {
            entry["hide"] = true;
        }
    }
}

function append_match_row(tbody, match)
{
    // deep copy
    var orgentry = match["entry"]
    var entry = _.cloneDeep(orgentry)

    // some entry details are not stored directly in the dictionary file and need to be calculated dynamically.
    manipulate_entry(entry)
    if (entry["hide"]) return

    // convenience
    var gloss = []
    gloss.push.apply(gloss, entry["gloss"])
    if (show_rudegloss && entry["rudegloss"])
    {
        gloss.push.apply(gloss, entry["rudegloss"])
    }
    var en = gloss.join(", ")
    var orths = entry["cw"]

    if (gloss.length == 0) return;
    if (orths.length == 0) return;

    var details_links = []

    // construct html for CW cell
    var orthhtml = ""
    for (var j = 0; j < orths.length; ++j)
    {
        cw = orths[j]
        if (j > 0)
        {
            orthhtml += ", "
        }
        orthhtml += display_cwtext(cw.value)
        orth = cw["orth"]
        orthhtml += orthkey_html(orth);
    }

    var src_popovers = []
    var srchtml = ""
    var first = true;
    if (entry["sources"])
    {
        for (var j = 0; j < entry["sources"].length; ++j)
        {
            source = entry["sources"][j]
            if (source == undefined) continue;
            if (typeof (source) !== 'object')
            {
                if (!source_legend[source])
                {
                    console.log(`failed to look up source "${source}"`)
                    continue;
                }
                source = source_legend[source]
            }
            if (!first) srchtml += ", ";
            first = false;
            srcclass=""
            if (source["tag"] == "h")
            {
                srcclass = "hobbyist"
            }
            srchtml += `<span id=\"gid-${gid_it}\" class=\"${srcclass}\">${source["display"]}`
            if (source["tag"] == "gr")
            {
                srchtml += orthkey_html("gr")
            }
            if (source["href"])
            {
                srchtml += ` <a href="${source["href"]}"><span class="glyphicon glyphicon-link"></span></a>`
            }
            srchtml += "</span>"

            // popcontent --
            popcontent = ""
            if (source["tag"] == "h")
            {
                // hobbyist
                popcontent = `<p><i>${source["name"]}</i></p>`
            }
            else
            {
                // other
                if (source["date"])
                {
                    popcontent = `<p>${source["author"]}. <i>${source["name"]}</i>. ${source["date"]}.</p>`;
                }
                else
                {
                    popcontent = source["name"]
                }
                if (source["tag"] == "gr")
                {
                    popcontent += `\n<p><i>This source is marked as being relevant or specific to Southern / Grand Ronde creolized Chinook Wawa.</i></p>`
                }
            }
            title = source["display"]
            if (source["tag"] == "cj")
            {
                title = source["name"];
                popcontent = `<p>${source["date"]}</p><p>From Dave Robertson's Chinook Jargon blog.</p>`
            }
            src_popovers.push({
                id: `#gid-${gid_it}`,
                title: title,
                content: popcontent
            })
            gid_it++;
        }
    }
    else
    {
        srchtml = "<i style=\"color:gray;\">[Source Missing]</i>"
    }

    // usage
    if (entry["use"] !== undefined && entry["use"] > 0)
    {
        if (entry["uses"] !== undefined && entry["uses"].length > 0)
        {
            if (!first) srchtml += ", ";
            first = false;
            let metric = sigfigs(100 * entry["use"] / corpus_usage_all, 2) + "%"
            srchtml += `<span id=\"gid-${gid_it}\" style=\"color:${tag_color["Corpus"]};\">Corpus:&nbsp;${metric}</span>`
            details_links.push(`#gid-${gid_it}`)
            titlecw = display_cwtext(orths[0].value);

            popcontent = `<p>${corpus_disclaimer}</p>`
            popcontent += `<p><b>Usage:</b> ${entry["use"]} of ${corpus_usage_all} words in corpus.</p>`
            popcontent += `<p><b>Rank:</b> ${entry["rk"]}${superordinal(entry["rk"])} most frequent.</p>`

            src_popovers.push({
                id: `#gid-${gid_it}`,
                title: `Corpus data for \"<i>${titlecw}</i>\"`,
                content: popcontent
            })
            gid_it++;
        }
    }

    var taghtml = ""
    if (entry["tags"])
    {
        for (var j = 0; j < entry["tags"].length; ++j)
        {
            tag = entry["tags"][j]
            tagcol = tag_color[tag];
            tagdesc = tag_description[tag]
            if (tagcol == null) tagcol = "gray"
            if (j > 0) taghtml += " "
            taghtml += `<span class="tag" id="gid-${gid_it}" style="background: ${tagcol};">${tag}</span>`
            src_popovers.push({
                id: `#gid-${gid_it}`,
                title: tag,
                content: tagdesc,
                placement: "right"
            });
            gid_it++;
        }
    }

    var orghtml = ""
    var origin = entry["origin"]
    if (origin && origin["language"] != "")
    {
        orghtml += origin["language"];
        if (origin["unknown"])
        {
            orghtml = `<i style="color:gray;">${orghtml}<sup><abbr title="Origin tentative, dubious, or unknown">[?]</abbr></sup></i>`;
        }
        orghtml = `<span id="gid-${gid_it}">${orghtml}</span>`;

        // popover
        popcontent = `<p>${origin["language-full"]}</p>`
        if (origin["word"] != "")
        {
            popcontent += `\n<p>"${origin["word"]}"</p>`
        }
        if (origin["unknown"]) {
            popcontent += `\n<p><i>Note: this information is marked as "unknown, dubious, or tentative"</i></p>`
        }
        src_popovers.push({
            id: `#gid-${gid_it}`,
            title: "Origin",
            content: popcontent
        })

        gid_it++;
    }

    // similarity %
    var similarity = (100 - 100 * match["dissimilarity"]).toFixed(0)

    let hash = location.hash;
    if (!hash.startsWith("#")) hash = "#" + hash;

    let detid = `gid-${gid_it++}`
    //details_links.push("#" + detid)
    var dethtml = `<a id="${detid}" href="${hash}&${get_entry_perma(entry)}"><span class = \"glyphicon glyphicon-menu-right\"/></a>`

    // row html
    var tr = `<tr>
        <td>${similarity}%</td>
        <td>${taghtml}</td>
        <td>${en}</td>
        <td>${orthhtml}</td>
        <td>${orghtml}</td>
        <td>${srchtml}</td>
        <td>${dethtml}</td>
    </tr>`

    // append row to table
    tbody.append(tr);

    // add popover elements (this has to happen after tr has been added to DOM... presumably...)
    for (var j = 0; j < src_popovers.length; ++j)
    {
        var placement = src_popovers[j].placement;
        if (!placement) placement = "left"
        $(src_popovers[j].id).popover(
            {
                html:true,
                placement:placement,
                trigger:"hover",
                title:src_popovers[j].title,
                content:src_popovers[j].content
            }
        );
    }

    // add link to details page
    for (var details_link of details_links)
    {
        $(details_link).click(function (event) {
            console.log("clicked")
            entry_details = orgentry;
            event.preventDefault()
            do_update();
        })
    }
}

var search_id = 0;
var subheader_id = 0;
var killsearch = null;
var prev_search_direction = null

function do_update()
{
    if (entry_details !== null)
    {
        return do_entry();
    }
    else
    {
        return do_search();
    }
}

function do_search()
{
    entry_details = null;
    alt = $("#alt-container");
    alt.empty();

    $("#results-container").show();

    // search parameters
    var text = $("#search").val()
    var search_direction = $("#search-direction").find("option:selected").text().trim();
    console.log(`searching (${search_direction})...`)

    // simplify
    text = text.trim().slice(0, 30)

    var search_fn = null
    var guide_text = ""
    if (search_direction == "CW")
    {
        search_fn = search
        guide_text = "a <b>Chinook Wawa</b>"
    }
    else if (search_direction == "English")
    {
        search_fn = search_gloss
        guide_text = "an <b>English</b>"
    }
    else
    {
        search_fn = search_both
        guide_text = "a <b>Chinook Wawa</b> or <b>English</b>"
    }

    // replace guide text
    if (search_direction != prev_search_direction)
    {
        prev_search_direction = search_direction
        $("#subheader").css("opacity", '0')
        l_subheader_id = ++subheader_id;
        setTimeout(
            function() {
                // only most recently queued command takes priority.
                if (l_subheader_id == subheader_id)
                {
                    $("#subheader").css("opacity", "1")
                    $("#guide-text").html(guide_text);
                }
            },
            subheader_id == 1 ? 0 : 250
        )
    }

    // validate
    if (text.length == 0) return;
    if (search_fn == null) return;

    // begin search animation
    var loader = $("#loader-6")
    loader.css("opacity", '1')

    // kill ongoing search if possible
    if (killsearch) killsearch();

    // perform search
    var l_search_id = ++search_id;
    killsearch = search_fn(text, function(matches) {
        if (l_search_id == search_id) // only show latest search results.
        {
            killsearch = null;

            console.log("search complete");

            // store query parameters in url.
            write_url_params();

            // fade out search animation
            loader.css("opacity", '0');

            // display results
            var tbody = $('#results tbody')
            tbody.empty();

            for (var i = 0; i < matches.length; ++i)
            {
                append_match_row(tbody, matches[i])
            }
        }
        else
        {
            console.log("search defunct");
        }
    })
}

function do_entry()
{
    // convenience
    const entry = entry_details;
    var gloss = []
    gloss.push.apply(gloss, entry["gloss"])
    if (show_rudegloss && entry["rudegloss"])
    {
        gloss.push.apply(gloss, entry["rudegloss"])
    }
    var en = gloss.join(", ")
    var orths = entry["cw"]

    if (orths.length == 0) return;
    if (gloss.length == 0) return;

    // prepare page
    $("#loader-6").css("opacity", '0');
    $('#results tbody').empty();
    $("#results-container").hide();
    alt = $("#alt-container");
    alt.empty();

    // content
    let paneltitle = `Entry details for "<b>${display_cwtext(entry_details.cw[0].value)}</b>"`
    let panelcontent = ""
    panelcontent += `<p><b>Gloss:</b> ${en}</p>`

    let tbody = ""
    for (const o of orths)
    {
        tbody += "<tr>"
        tbody += `<td>${display_cwtext(o.value)}</td>`
        if (orthography_legend[o.orth] !== undefined)
        {
            tbody += `<td>${orthography_legend[o.orth]}${orthkey_html(o.orth)}</td>`
        }
        else
        {
            tbody += "<td>(Attested)</td>"
        }
        tbody += "</tr>"
    }

    let table = `
    <table class="table table-striped" id="results">
        <thead>
            <tr>
                <th>Spelling</th>
                <th>Orthography</th>
            </tr>
        </thead>
        <tbody>${tbody}</tbody>
    </table>`

    panelcontent += table

    if (entry.uses !== undefined && entry.uses.length > 0 && entry.use !== undefined && entry.use > 0)
    {
        panelcontent += `<h3>Corpus Data</h3><p>${corpus_disclaimer}</p>`

        let metric = sigfigs(100 * entry.use / corpus_usage_all, 2) + "%"
        panelcontent += `<p><b>Usage:</b> ${entry.use} of ${corpus_usage_all} words in corpus, or ${metric}.`
        panelcontent += `<p><b>Rank:</b> ${entry.rk}${superordinal(entry.rk)} most frequent.</p>`
        
        if (entry.uses !== undefined && entry.uses.length > 0)
        {
            let tbody = ""

            for (const use of entry.uses)
            {
                tbody += "<tr>"
                tbody += `<td><a href="${use.href}">${use.title}</a>`
                tbody += "</tr>"
            }

            let table = `
            <table class="table table-striped" id="results">
                <thead>
                    <tr>
                        <th>Example</th>
                    </tr>
                </thead>
                <tbody>${tbody}</tbody>
            </table>`

            panelcontent += table
        }
    }
    

    // update page and location.hash
    alt.append(`<div class="panel panel-primary"><div class="panel-heading">${paneltitle}</div><div class="panel-body">${panelcontent}</div></div>`)
    write_url_params();
}

function encode_escape(s)
{
    return encodeURIComponent(s);
}

function decode_escape(s)
{
    return decodeURIComponent(s);
}

function lookup_entry_by_cw(cw)
{
    for (const entry of dictionary)
    {
        for (const ecw of entry.cw)
        {
            if (normalize(ecw.value) == normalize(cw))
            {
                return entry;
            }
        }
    }

    return null
}

function lookup_entry_by_id(id)
{
    for (const entry of dictionary)
    {
        if (entry.id == id)
        {
            return entry;
        }
    }

    return null
}

function get_entry_perma(entry)
{
    var entry_cw = undefined;
    for (const cw of entry.cw)
    {
        if (lookup_entry_by_cw(cw.value).id == entry.id)
        {
            entry_cw = cw.value
            break;
        }
    }

    if (entry_cw !== undefined)
    {
        return `entry=${encode_escape(entry_cw)}`
    }
    else
    {
        return `entryid=${encode_escape(entry.id)}`
    }
}

function write_url_params()
{
    
    let term = encode_escape($("#search").val());
    let dir = encode_escape(["cwen", "cw", "en"][$('#search-direction').val()]);
    let showparam = ""
    if (caution_hide != caution_hide_default)
    {
        showparam = `&show=${caution_hide}`
    }

    let hstr = `#t=${term}&dir=${dir}${showparam}`;
    if (entry_details != null)
    {
        hstr += "&" + get_entry_perma(entry_details)
    }

    hash_block();
    location.hash = hstr;
}

function read_url_params()
{
    // restore defaults
    entry_details = null;
    show_rudegloss = false;
    caution_hide = caution_hide_default;


    // read params
    let hashv = location.hash;
    console.log("reading url params:", hashv)
    if (hashv && hashv.length > 1)
    {
        let m = hashv.match(/^#?t=([^&]*)&dir=([^&]+)(&show=[0-9]+)?(&entry=[^&]+)?(&entryid=[0-9]+)?$/)
        if (m && m.length >= 3)
        {
            // set search term
            let term = decode_escape(m[1])
            $("#search").val(term)

            // parse miscellaneous flags
            for (var i = 3; i < m.length; ++i)
            {
                let s = m[i];
                if (s === undefined || s == "") continue;
                let eql = s.indexOf('=');
                if (eql < 0) continue;
                let key = s.substring(1, eql);
                let val = decode_escape(s.substring(eql + 1))
                console.log(key, '=', val);
                if (key == "show")
                {
                    caution_hide = parseInt(val);
                    show_rudegloss = caution_hide > caution_show_rudegloss;
                    $('#show-rude').prop("checked", !show_rudegloss);
                }
                if (key == "entry")
                {
                    console.log("looking up entry", val)
                    entry_details = lookup_entry_by_cw(val);
                    console.log("entry found:", !!entry_details)
                }
                else if (key == "entryid")
                {
                    entry_details = lookup_entry_by_id(parseInt(val))
                }
            }

            // set search direction
            let dir = decode_escape(m[2])
            let dirv = ["cwen", "cw", "en"].indexOf(dir)
            if (dirv >= 0)
            {
                $('#search-direction').val(dirv);
            }
        }
    }
}