/*
PDF-PAGER

Copyright © 2022 Martin Smith

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without 
restriction, including without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or 
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*/

/**
 * Handle @PDF links inline:
 * 
 * @PDF[bookname|page=xxx]{label}
 * 
 * or the newer format
 * 
 * @PDF[journal|bookname|page=xxx]{label}
 * 
 * (The first format assumes that the journal has the same name as bookname)
 * 
 * If the PDF is not available then the link is replaced by just the label, with no sign of a broken link.
 */

/**
 * Enrich the generated HTML to show a link or just plain text
 */

 const pattern = /@PDF\[([^|#\]]+)(?:#([^\|\]]+))?(?:\|(page=\d+))?\]{([^}]*)}/g;

 Hooks.once('ready', () => {
    // Fields on Actors and Items call enrichHTML with async=false
	libWrapper.register('pdf-pager', 'TextEditor.enrichHTML', _myenrichHTML, 'WRAPPER');

    // The TextEditor.encrichers only works when enrichHTML is called with async=true
    CONFIG.TextEditor.enrichers.push({pattern, enricher});
})

function getAnchor(match) {
    // the pattern will put the page into p2 if only bookname is provided
    const [ matches, journalname, bookname, pagenum, label] = match;

    // Find the relevant PAGE in the relevant JOURNAL ENTRY
    let journal = game.journal.getName(journalname);
    if (!journal) {
        console.debug(`PDF-PAGER: failed to find journal entry called '${journalname}'`)
        return null;
    }
    const pagename = bookname || journalname;
    let page = journal.pages.find(page => page.type === 'pdf' && page.name === pagename);
    if (!page) {
        console.debug(`PDF-PAGER: failed to find page called '${pagename}' inside journal '${journalname}'`)
        return null;
    }
    let attrs = {draggable: true};
    if (pagenum) attrs["data-hash"] = pagenum;
    return page.toAnchor({
        classes: ["content-link"],
        attrs,
        name: label
    });
}

/**
 * Hooked directly into TextEditor.enrichHTML to cope with async=false
 * @param {} wrapped 
 * @param {*} content 
 * @param {*} options 
 * @returns 
 */
function _myenrichHTML(wrapped, content, options) {
    let text = content;
    if (!options.async && text.includes('@PDF[')) {
        text = text.replaceAll(pattern, (match, p1, p2, /*p3*/pagenum, /*p4*/label, options, groups) => {
            const anchor = getAnchor([match, p1, p2, pagenum, label]);
            return anchor ? anchor.outerHTML : label;
        });
    }
    return wrapped(text, options);
}

/**
 * Registered with CONFIG.TextEditor.enrichers to cope with async=true (not strictly necessary at this time)
 * @param {*} match 
 * @param {*} options 
 * @returns 
 */
async function enricher(match, options) {
    return getAnchor(match) || match[4];
}