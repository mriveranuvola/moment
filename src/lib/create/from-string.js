import { matchOffset } from '../parse/regex';
import { configFromStringAndFormat } from './from-string-and-format';
import { hooks } from '../utils/hooks';
import { deprecate } from '../utils/deprecate';
import getParsingFlags from './parsing-flags';

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var isoRegex = /^\s*((?:[+-]\d{6}|\d{4})-?(?:\d\d$|\d\d-?\d\d|W\d\d$|W\d\d-?\d|\d\d\d))(?:(T| )(\d\d(?::?\d\d(?::?\d\d(?::?[.,]\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/, true],
    ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/, true],
    ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/, true],
    ['GGGG-[W]WW', /\d{4}-W\d{2}/, true],
    ['YYYY-DDD', /\d{4}-\d{3}/, true],
    ['YYYYYYMMDD', /[+-]\d{6}\d{2}\d{2}/, false],
    ['YYYYMMDD', /\d{4}\d{2}\d{2}/, false],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{2}\d/, false],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{4}\d{3}/, false]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/, true],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/, true],
    ['HH:mm', /\d\d:\d\d/, true],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/, false],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/, false],
    ['HHmmss', /\d\d\d\d\d\d/, false],
    ['HHmm', /\d\d\d\d/, false],
    ['HH', /\d\d/, null]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
export function configFromISO(config) {
    var i, l,
        string = config._i,
        match = isoRegex.exec(string),
        extendedDate, extendedTime;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                config._f = isoDates[i][0];
                extendedDate = isoDates[i][2];
                break;
            }
        }
        for (i = 0, l = isoTimes.length; i < l; i++) {
            if (isoTimes[i][1].exec(match[3])) {
                // match[2] should be 'T' or space
                config._f += (match[2] || ' ') + isoTimes[i][0];
                extendedTime = isoTimes[i][2];
                break;
            }
        }
        if (extendedDate != null &&
                extendedTime != null &&
                extendedDate !== extendedTime) {
            // extended and basic formats for date and time can NOT be mixed
            config._isValid = false;
            return;
        }
        matchOffset.lastIndex = 0;
        if (matchOffset.exec(match[4])) {
            config._f += 'Z';
        }
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
export function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
        hooks.createFromInputFallback(config);
    }
}

hooks.createFromInputFallback = deprecate(
    'moment construction falls back to js Date. This is ' +
    'discouraged and will be removed in upcoming major ' +
    'release. Please refer to ' +
    'https://github.com/moment/moment/issues/1407 for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);
