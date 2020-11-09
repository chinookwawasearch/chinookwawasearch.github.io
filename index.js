var gid_it = 0

function orthkey_html(orth)
{
    if (orth != "")
    {
        legend = orthography_legend[orth]
        style = orthography_color[orth]
        return `<sup class="orthkey" style="color:${style};">[<abbr title="${legend}">${orth}</abbr>]</sup>`
    }
    return ""
}

function append_match_row(tbody, match)
{
    entry = match["entry"]
    en = entry["gloss"].join(", ")
    orths = entry["cw"]

    // construct html for CW cell
    orthhtml = ""
    for (var j = 0; j < orths.length; ++j)
    {
        cw = orths[j]
        if (j > 0)
        {
            orthhtml += ", "
        }
        orthhtml += cw["value"]
        orth = cw["orth"]
        orthhtml += orthkey_html(orth);
    }

    src_popovers = []
    srchtml = ""
    if (entry["sources"])
    {
        for (var j = 0; j < entry["sources"].length; ++j)
        {
            source = entry["sources"][j]
            if (typeof (source) !== 'object')
            {
                source = source_legend[source]
            }
            if (j > 0) srchtml += ", "
            srchtml += `<span id=\"gid-${gid_it}\">${source["display"]}`
            if (source["tag"] == "gr")
            {
                srchtml += orthkey_html("gr")
            }
            if (source["href"])
            {
                srchtml += ` <a href="${source["href"]}"><span class="glyphicon glyphicon-link"></span></a>`
            }
            srchtml += "</span>"
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

    taghtml = ""
    if (entry["tags"])
    {
        for (var j = 0; j < entry["tags"].length; ++j)
        {
            tag = entry["tags"][j]
            tagcol = tag_color[tag];
            if (tagcol == null) tagcol = "gray"
            if (j > 0) taghtml += " "
            taghtml += `<span class="tag" style="background: ${tagcol};">${tag}</span>`
        }
    }

    orghtml = ""
    origin = entry["origin"]
    if (origin && origin["language"] != "")
    {
        orghtml += origin["language"];
        if (origin["unknown"])
        {
            orghtml = `<i style="color:gray;">${orghtml}<sup><abbr title="Origin dubious or unknown">[?]</abbr></sup></i>`;
        }
        orghtml = `<span id="gid-${gid_it}">${orghtml}</span>`;

        // popover
        popcontent = `<p>${origin["language-full"]}</p>`
        if (origin["word"] != "")
        {
            popcontent += `\n<p>"${origin["word"]}"</p>`
        }
        src_popovers.push({
            id: `#gid-${gid_it}`,
            title: "Origin",
            content: popcontent
        })

        gid_it++;
    }

    // similarity %
    similarity = (100 - 100 * match["dissimilarity"]).toFixed(0)

    // row html
    tr = `<tr>
        <td>${similarity}%</td>
        <td>${taghtml}</td>
        <td>${en}</td>
        <td>${orthhtml}</td>
        <td>${orghtml}</td>
        <td>${srchtml}</td>
    </tr>`

    // append row to table
    tbody.append(tr);

    // add popover elements (this has to happen after tr has been added to DOM... presumably...)
    for (var j = 0; j < src_popovers.length; ++j)
    {
        $(src_popovers[j].id).popover(
            {
                html:true,
                placement:"left",
                trigger:"hover",
                title:src_popovers[j].title,
                content:src_popovers[j].content
            }
        );
    }
}

function do_search()
{
    // search parameters
    const search_en = $('#toggle-direction').prop("checked")
    const text = $("#search").val()

    console.log("searching...")

    // validate
    if (text.length == 0) return;
    if (search == null) return;

    // perform search
    const matches = search(text)

    // display results
    var tbody = $('#results tbody')
    tbody.empty();

    for (var i = 0; i < matches.length; ++i)
    {
        append_match_row(tbody, matches[i])
    }
}

$(function() {
    $('#toggle-direction').bootstrapToggle({
        on: "CW-to-En",
        off: "En-to-CW"
    });
    $('#toggle-direction').change(function()
    {
        do_search()
    })
    $('#search').keypress(function (e) {
        if (e.which == 13) {
            do_search();
            return false;    // prevent default
        }
    });
})