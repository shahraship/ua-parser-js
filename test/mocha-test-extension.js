const fs = require('fs');
const assert = require('assert');
const parseJS = require('@babel/parser').parse;
const traverse = require('@babel/traverse').default;
const safe = require('safe-regex');
const UAParser = require('ua-parser-js');
const { Bots, CLIs, Emails, Modules } = require('ua-parser-js/extensions');

describe('Bots', () => {
    it('Can detect bots', () => {
        const googleBot = 'Googlebot-Video/1.0';
        const gptBot = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)';
        const msnBot = 'msnbot-media/1.1 (+http://search.msn.com/msnbot.htm)';
        const bingPreview = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534+ (KHTML, like Gecko) BingPreview/1.0b';
        const opera = 'Opera/8.5 (Macintosh; PPC Mac OS X; U; en)';
        const wget = 'Wget/1.21.1';
        const facebookBot = 'Mozilla/5.0 (compatible; FacebookBot/1.0; +https://developers.facebook.com/docs/sharing/webmasters/facebookbot/)';
        const outlook = 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; Microsoft Outlook 16.0.9126; Microsoft Outlook 16.0.9126; ms-office; MSOffice 16)';
        const thunderbird = 'Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Thunderbird/78.13.0';
        const axios = 'axios/1.3.5';
        const jsdom = 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3';
        const scrapy = 'Scrapy/1.5.0 (+https://scrapy.org)';
        const botify = 'Mozilla/5.0 (compatible; botify; http://botify.com)';

        const botParser = new UAParser(Bots);
        assert.deepEqual(botParser.setUA(googleBot).getBrowser(), {name: "Googlebot-Video", version: "1.0", major: "1", type: "bot"});
        assert.deepEqual(botParser.setUA(gptBot).getBrowser(), {name: "GPTBot", version: "1.0", major: "1", type: "bot"});
        assert.deepEqual(botParser.setUA(msnBot).getBrowser(), {name: "msnbot-media", version: "1.1", major: "1", type: "bot"});
        assert.deepEqual(botParser.setUA(bingPreview).getBrowser(), {name: "BingPreview", version: "1.0b", major: "1", type: "bot"});
        assert.deepEqual(botParser.setUA(opera).getBrowser(), {name: "Opera", version: "8.5", major: "8"});
        assert.deepEqual(botParser.setUA(botify).getBrowser(), {name: "botify", version: undefined, major: undefined, type: "bot"});

        // try merging Bots & CLIs
        const botsAndCLIs = { browser : [...Bots.browser, ...CLIs.browser]};
        const botsAndCLIsParser = new UAParser(botsAndCLIs);
        assert.deepEqual(botsAndCLIsParser.setUA(wget).getBrowser(), {name: "Wget", version: "1.21.1", major: "1", type:"cli"});
        assert.deepEqual(botsAndCLIsParser.setUA(facebookBot).getBrowser(), {name: "FacebookBot", version: "1.0", major: "1", type:"bot"});

        const emailParser = new UAParser(Emails);
        assert.deepEqual(emailParser.setUA(outlook).getBrowser(), {name: "Microsoft Outlook", version: "16.0.9126", major: "16", type: "email"});
        assert.deepEqual(emailParser.setUA(thunderbird).getBrowser(), {name: "Thunderbird", version: "78.13.0", major: "78", type: "email"});

        const moduleParser = new UAParser(Modules);
        assert.deepEqual(moduleParser.setUA(axios).getBrowser(), {name: "axios", version: "1.3.5", major: "1", type: "module"});
        assert.deepEqual(moduleParser.setUA(jsdom).getBrowser(), {name: "jsdom", version: "20.0.3", major: "20", type: "module"});
        assert.deepEqual(moduleParser.setUA(scrapy).getBrowser(), {name: "Scrapy", version: "1.5.0", major: "1", type: "module"});
    });
});

// TODO : move test spec to JSON file

describe('Testing regexes', () => {

    let regexes;

    before('Read main js file', () => {
        let code = fs.readFileSync('src/extensions/ua-parser-extensions.js', 'utf8').toString();
        let ast = parseJS(code, { sourceType: 'script' });
        regexes = [];
        traverse(ast, {
            RegExpLiteral: (path) => {
                regexes.push(path.node.pattern);
            }
        });
        if (regexes.length === 0) {
            throw new Error('Regexes cannot be empty!');
        }
    });

    describe('Begin testing', () => {
        it('all regexes in extension file', () => {
            regexes.forEach(regex => {
                describe('Test against `safe-regex` : ' + regex, () => {
                    it('should be safe from potentially vulnerable regex', () => {
                        assert.strictEqual(safe(regex), true);
                    });
                });
            });
        });
    });
});