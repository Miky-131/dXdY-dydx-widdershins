var recurseotron = require('openapi_optimise/common.js');
var circular = require('openapi_optimise/circular.js');
var jptr = require('jgexml/jpath.js');

/* originally from https://github.com/for-GET/know-your-http-well/blob/master/json/status-codes.json */
/* "Unlicensed", public domain */
var statusCodes = require('./statusCodes.json');

// could change these to be regexes...
var xmlContentTypes = ['application/xml', 'text/xml', 'image/svg+xml', 'application/rss+xml', 'application/rdf+xml', 'application/atom+xml', 'application/mathml+xml', 'application/hal+xml'];
var jsonContentTypes = ['application/json', 'text/json', 'application/hal+json', 'application/ld+json', 'application/json-patch+json'];
var yamlContentTypes = ['application/x-yaml', 'text/x-yaml'];

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function dereference(obj, circles, api) {
    while (obj && obj["$ref"]) {
        obj = jptr.jptr(api, obj["$ref"]);
    }
    var changes = 1;
    while (changes > 0) {
        changes = 0;
        recurseotron.recurse(obj, {}, function (obj, state) {
            if ((state.key === '$ref') && (typeof obj === 'string') && (!circular.isCircular(circles, obj))) {
                state.parents[state.parents.length - 2][state.keys[state.keys.length - 2]] = jptr.jptr(api, obj);
                delete state.parent["$ref"];
                changes++;
            }
        });
    }
    return obj;
}

function doContentType(types, targets) {
    for (var type in types) {
        for (var target of targets) {
            if (types[type] === target) return true;
        }
    }
    return false;
}

function languageCheck(language, language_tabs, mutate) {
    var lcLang = language.toLowerCase();
    if (lcLang === 'c#') lcLang = 'csharp';
    if (lcLang === 'c++') lcLang = 'cpp';
    for (var l in language_tabs) {
        var target = language_tabs[l];
        if (typeof target === 'object') {
            if (Object.keys(target)[0] === lcLang) {
                return lcLang;
            }
        }
        else {
            if (target === lcLang) return lcLang;
        }
    }
    if (mutate) {
        var newLang = {};
        newLang[lcLang] = language;
        language_tabs.push(newLang);
        return lcLang;
    }
    return false;
}

module.exports = {
	statusCodes : statusCodes,
	xmlContentTypes : xmlContentTypes,
	jsonContentTypes : jsonContentTypes,
	yamlContentTypes : yamlContentTypes,
	dereference : dereference,
	doContentType : doContentType,
	languageCheck : languageCheck,
	clone : clone
};