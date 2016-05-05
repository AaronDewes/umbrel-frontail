'use strict';

require('should');
var fs = require('fs');
var jsdom = require('jsdom');
var EventEmitter = require('events').EventEmitter;

describe('browser application', function () {
    var io, window;

    beforeEach(function (done) {
        io = new EventEmitter();
        var html = '<title></title><body><div class="topbar"></div>' +
            '<div class="log"></div><input type="test" id="filter"/></body>';
        var ansiup = fs.readFileSync('./lib/web/assets/ansi_up.js', 'utf-8');
        var src = fs.readFileSync('./lib/web/assets/app.js', 'utf-8');


        jsdom.env({html: html, src: [ansiup, src], onload: function (domWindow) {
            window = domWindow;

            initApp();
            done();
        }});
    });

    it('should show lines from socket.io', function () {
        io.emit('line', 'test');

        var log = window.document.querySelector('.log');
        log.childNodes.length.should.be.equal(1);
        log.childNodes[0].textContent.should.be.equal('test');
        log.childNodes[0].className.should.be.equal('line');
        log.childNodes[0].tagName.should.be.equal('DIV');
        log.childNodes[0].innerHTML.should.be.equal('<p class="inner-line">test</p>');
    });

    it('should select line when clicked', function () {
        io.emit('line', 'test');

        var line = window.document.querySelector('.line');
        clickOnElement(line);

        line.className.should.be.equal('line-selected');
    });

    it('should deselect line when selected line clicked', function () {
        io.emit('line', 'test');

        var line = window.document.querySelector('.line');
        clickOnElement(line);
        clickOnElement(line);

        line.className.should.be.equal('line');
    });

    it('should limit number of lines in browser', function () {
        io.emit('options:lines', 2);
        io.emit('line', 'line1');
        io.emit('line', 'line2');
        io.emit('line', 'line3');

        var log = window.document.querySelector('.log');
        log.childNodes.length.should.be.equal(2);
        log.childNodes[0].textContent.should.be.equal('line2');
        log.childNodes[1].textContent.should.be.equal('line3');
    });

    it('should hide topbar', function () {
        io.emit('options:hide-topbar');

        var topbar = window.document.querySelector('.topbar');
        topbar.className.should.match(/hide/);
        var body = window.document.querySelector('body');
        body.className.should.match(/no-topbar/);
    });

    it('should not indent log lines', function () {
        io.emit('options:no-indent');

        var log = window.document.querySelector('.log');
        log.className.should.match(/no-indent/);
    });

    it('should highlight word', function () {
        io.emit('options:highlightConfig', {words: {line: 'background: black'}});
        io.emit('line', 'line1');

        var line = window.document.querySelector('.line');
        line.innerHTML.should.containEql('<span style="background: black">line</span>');
    });

    it('should highlight line', function () {
        io.emit('options:highlightConfig', {lines: {line: 'background: black'}});
        io.emit('line', 'line1');

        var line = window.document.querySelector('.line');
        line.parentNode.innerHTML.should.equal(
            '<div class="line" style="background: black"><p class="inner-line">line1</p></div>'
        );
    });

    it('should escape HTML', function () {
        io.emit('line', '<a/>');

        var line = window.document.querySelector('.line');
        line.innerHTML.should.equal('<p class="inner-line">&lt;a/&gt;</p>');
    });

    var initApp = function () {
        window.App.init({
            socket: io,
            container: window.document.querySelector('.log'),
            filterInput: window.document.querySelector('#filter'),
            topbar: window.document.querySelector('.topbar'),
            body: window.document.querySelector('body')
        });
    };

    var clickOnElement = function (line) {
        var click = window.document.createEvent('MouseEvents');
        click.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        line.dispatchEvent(click);
    };
});
