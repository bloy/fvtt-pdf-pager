[![ko-fi](https://img.shields.io/badge/Ko--Fi-farling-success)](https://ko-fi.com/farling)
[![patreon](https://img.shields.io/badge/Patreon-amusingtime-success)](https://patreon.com/amusingtime)
[![paypal](https://img.shields.io/badge/Paypal-farling-success)](https://paypal.me/farling)
![GitHub License](https://img.shields.io/github/license/farling42/fvtt-pdf-pager)
![Foundry Info](https://img.shields.io/badge/Foundry-v10-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/farling42/fvtt-pdf-pager/latest/module.zip)

# PDF Pager

This module augments the core PDF functionality by adding support for opening PDFs at a specific page, or using a PDF as an Actor sheet.

It also generates reads the Outline from the PDF file to use as the Table of Contents in the page navigation panel.

## Automatically load PDF

The module option "Immediately Display PDF" will remove the "Load PDF" button from the PDF pages of journal and will instead immediately load the PDF into the window.

## PDF Character Sheets

This module will allow a fillable PDF document to be used as the Actor sheet for actors.

### Same PDF for all Actors of each type

In the module configuration window the various "SHEETS: ..." options allow you specify the PDF document which should be used for each type of Actor.

Once a sheet has been configured in the module configuration window, then open an Actor (of the corresponding type) and select use the "Sheet" button in the window's title bar to change the sheet (or default sheet) to "PDF Sheet". The window will then reopen to show the configured PDF document.

### Different PDF for a specific Actor

A generic PDF needs to be configured as above, but then in the Actor's title bar will be a new button, "Custom PDF", where a different PDF document can be selected for use by only this Actor.

### Mapping PDF fields to Actor fields

Without setting up a mapping, any data entered into the sheet will be stored on the Actor in hidden fields (in the 'pdf-pager' flags).

To map the PDF fields to Actor fields (such as hit points or armour class), a mapping is required. This can be prepared outside of Foundry and then pasted into the corresponding "Field Mappings..." box of the module settings window. The simple case is to have something like:

```js
{
    "CurrentHP": "system.attribs.hp.value",
    "CurrentMagic": "system.attribs.mp.value"
}
```

The first string in each line should be the name of the PDF field, and the second string in each line should be the path within the Actor in which to store the data. (The full list of Actor fields can be found by using the "Inspect Data" button in the Actor window title bar.)

More complicated attributes can be handled by defining setValue and getValue functions (see below).

### Loading data from an already filled PDF

If you have a fillable PDF saved outside of Foundry which contains data in the fields, then the module setting "Read Fields From PDF" can be temporarily enabled so that when the Actor window is opened, any data stored in the fields of the PDF configured for that Actor will be read from the PDF and stored on the Actor (overwriting any old values for that data on the Actor).

## Opening Journal PDF pages at a specific page within the PDF

The PDF Page editor has two new fields: "Page Offset" and "PDF Code".

The "Page Offset" can be used to identify how a page number in a link (see below) is converted into a page within the PDF (since some PDFs have extra pages at the start before the official "Page 1").

The "PDF Code" is used to identify a specific PDF document for use with some helper functions

### Method 1: update normal Foundry link

An existing Foundry link to a specific PDF page can be augmented with "#page=x" at the end of the link in order to open the PDF at the specified page.

```code
@UUID[JournalEntry.T29aMDmLCPYybApI.JournalEntryPage.iYV6uMnFwdgZORxi#page=10]{label}
```

### Method 2: Use `@PDF` link

As was available in PDFoundry (for Foundry V9 and earlier), a new link type can be used which uses the journal name and page name instead of the UUID of the document. If 'pagename' is not present, then the first PDF page within the given journal entry will be used. The '|page=xxx' is optional.

```code
@PDF[journalname]{label}
@PDF[journalname|page=xxx]{label}
@PDF[journalname#pagename]{label}
@PDF[journalname#pagename|page=xxx]{label}
@PDF[journalname#pagename|sectionslug]{label}
```

Note the use of `#page=10` with a `@@UID`, and the use of `|page=10` with a `@PDF` link.

### Method 3: Open PDF from a macro/module

For macro and module writers, a function is available to open a PDF, optionally at a specific page, using the "PDF Code" configured for that specific PDF within the journal page window. The function takes a second optional parameter in which can be specified the specific page to be opened within the PDF, and/or the UUID of the Document to be displayed within a fillable PDF.

```js
ui.pdfpager.openPDFByCode("PHB")
ui.pdfpager.openPDFByCode("DMG", { page : 30 } )
ui.pdfpager.openPDFByCode("SHEET", { uuid: 'Actor.CY4zUd7qYUeer3d4' } )
```

## Installation

The module is available from the Foundry Module Management window, just search for "PDF Pager", or it can be manually added with the following link:

https://github.com/farling42/fvtt-pdf-pager/releases/latest/download/module.json

## Migrating from PDFoundry

Function are available which can be called directly from a macro script or from the console command-line to migrate your existing PDFoundry documents and links to the new format.

### migratePDFoundry()

This function creates a page in each journal entry containing the information previously configured using PDFoundry for each PDF.

This function also automatically migrates FormData which might have been present on Actors used with the PDFoundry module.

It takes a single optional parameter which is an object that can contain the single boolean field 'onlyIfEmpty', which if set will only migrate PDFoundry journal entries which currently have no pages.

```js
ui.pdfpager.migratePDFoundry()
ui.pdfpager.migratePDFoundry( { onlyIfEmpty:true } )
```

The second version is triggered automatically on starting the game (or enabling the module).

### replacePDFlinks

If you no longer want to have `@PDF[name]` links in your documents, a function is provided to convert them to the Foundry V10 standard format of `@UUID[longuuid]` format.

The new link will be to a Journal Entry called "bookname" (see OLD syntax below), and one of the PDF pages inside that journal entry: either a PDF page called "bookname" otherwise the first PDF page in that journal entry.

OLD: `@PDF[bookname|page=xxx]{label}`

NEW: `@UUID[full-uid-to-pdf-page#page=xxx]{label}`

```js
ui.pdfpager.replacePDFlinks()
```

## Extra information for Actor PDFs

### Accessing data stored in hidden fields

If you want to access the 'hidden' fields in macros or other modules, each field is stored on the Actor as `flags['pdf-pager'].fieldText['nameoffield']`  (where 'nameoffield' is the name of the field in the PDF (if the PDF field has no name, then it's id will be used instead).

Two helper functions are provided to help access this information in a more elegant manner. The 'fieldname' is the name of the field in the PDF.

```js
ui.pdfpager.setPDFValue(actor, fieldname, value)
let value = ui.pdfpager.getPDFValue(actor, fieldname)
```

### Setting up the Mapping to existing Actor/Item fields

There are two methods of configuring the mapping between Actor/Item fields and the PDF fields:

- a preconfigured file supplied by the module in the module/pdf-pager/systems folder (an example for the dnd5e game system is provided).
- a manual create Javascript object entered into the Field Mappings for Actors/Items field of the Module Settings window within Foundry.
- call one of both of the functions from a macro which will define the relevant mapping: `ui.pdfpager.registerActorMapping` or `ui.pdfpager.registerItemMapping`

#### Format of the mapping object

An example of using registerActorMapping to provide a mapping from PDF-field name to Actor field name.

```js
  {
     "CharacterName": "name",
     "STR": "system.abilities.str.value",
     "DEX": "system.abilities.dex.value",
     "CON": "system.abilities.con.value",
     "INT": "system.abilities.int.value",
     "WIS": "system.abilities.wis.value",
     "CHA": "system.abilities.cha.value",
     "STRmod": "system.abilities.str.mod",
     "DEXmod": "system.abilities.dex.mod",
     "CONmod": "system.abilities.con.mod",
     "INTmod": "system.abilities.int.mod",
     "WISmod": "system.abilities.wis.mod",
     "CHamod": "system.abilities.cha.mod",
     "Inspiration": { // "system.attributes.inspiration"
        getValue(actor) {
            return actor.system.attributes.inspiration ? "Y" : "";
        },
        setValue(actor, value) {
            actor.update( { ["system.attributes.inspiration"] : (value?.length > 0) })
        }
    },
  }
```

If there is a complex mapping for a field in the PDF (such as "Inspiration" in the above example), then the entry in the mapping can be defined as an object with the following functions:

- A `getValue(actor)` function that returns a string which will be the value put into the PDF field.
- An optional `setValue(actor,value)` function which is called when the user changes a value in the field. `value` contains the value that the user entered, and the setValue function is responsible for calling `actor.update()` with the relevant updates.

A simple example to convert a Boolean stored in the Actor record into a string ("Y") displayed in the PDF field.

```js
export let actormap = {
    "Inspiration": { // "system.attributes.inspiration"
        getValue(actor) {
            return actor.system.attributes.inspiration ? "Y" : "";
        },
        setValue(actor, value) {
            actor.update( { ["system.attributes.inspiration"] : (value?.length > 0) })
        }
    },
}
```

Feel free to forward me any system-specific .mjs files which you've created for inclusion in the systems folder.

### Inspect Data option for Actor sheet

The Data Inspector window from PDFoundry is available from the PDF Actor Sheet for those wanting to modify their own PDFs to use the data fields present in the Actor records. This window was taken directly from the PDFoundry module available for Foundry V9 and earlier at [PDFoundry](https://github.com/Djphoenix719/PDFoundry).

### Resetting the stored Outline for a PDF document

The outline for a PDF document is read the first time that a PDF is opened. If the PDF document is changed, then the TOC will be regenerated automatically.

It is also possible to call the function `ui.pdfpager.deleteOutlines()` from a macro in order to remove all stored Outlines from all PDFs in the world journal sidebar. In this case, the Outline will be regenerated when the PDF is next opened.

### Translations

Feel free to submit a pull request or an issue containing translations for the entries in the en.json file.
