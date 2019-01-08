import _regeneratorRuntime from 'babel-runtime/regenerator';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var fetchImages = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return fetch('/images?' + (state.tags.length ? 'tags=' + state.tags.join(',') + '&' : "") + ('' + (state.locations.length ? 'locations=' + state.locations.join(',') + '&' : "")) + ('' + (state.query ? 'query=' + state.query : ""))).then(function (res) {
                            return res.json();
                        }).catch(console.error);

                    case 2:
                        return _context.abrupt('return', _context.sent);

                    case 3:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function fetchImages() {
        return _ref4.apply(this, arguments);
    };
}();

var fetchTags = function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var tags;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return fetch("/tags").then(function (res) {
                            return res.json();
                        }).catch(console.error);

                    case 2:
                        tags = _context2.sent;

                        if (typeof tags == 'string') tags = [tags];
                        return _context2.abrupt('return', tags);

                    case 5:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function fetchTags() {
        return _ref5.apply(this, arguments);
    };
}();

var fetchLocations = function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var locations;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.next = 2;
                        return fetch("/locations").then(function (res) {
                            return res.json();
                        }).catch(console.error);

                    case 2:
                        locations = _context3.sent;

                        if (typeof locations == 'string') locations = [locations];
                        return _context3.abrupt('return', locations);

                    case 5:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function fetchLocations() {
        return _ref6.apply(this, arguments);
    };
}();

var fetchData = function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        var images, tags, locations;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        _context4.next = 2;
                        return fetchImages();

                    case 2:
                        images = _context4.sent;
                        _context4.next = 5;
                        return fetchTags();

                    case 5:
                        tags = _context4.sent;
                        _context4.next = 8;
                        return fetchLocations();

                    case 8:
                        locations = _context4.sent;
                        return _context4.abrupt('return', { images: images, tags: tags, locations: locations });

                    case 10:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function fetchData() {
        return _ref7.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

if (global === undefined) {
    var global = window;
}

var FilterControl = function (_React$Component) {
    _inherits(FilterControl, _React$Component);

    function FilterControl(props) {
        _classCallCheck(this, FilterControl);

        var _this = _possibleConstructorReturn(this, (FilterControl.__proto__ || Object.getPrototypeOf(FilterControl)).call(this, props));

        _this.state = { tags: [] };
        return _this;
    }

    _createClass(FilterControl, [{
        key: 'autocompleteRenderInput',
        value: function autocompleteRenderInput(_ref) {
            var addTag = _ref.addTag,
                props = _objectWithoutProperties(_ref, ['addTag']);

            var handleOnChange = function handleOnChange(e, _ref2) {
                var newValue = _ref2.newValue,
                    method = _ref2.method;

                if (method === 'enter') {
                    e.preventDefault();
                } else {
                    props.onChange(e);
                }
            };

            var inputValue = props.value && props.value.trim().toLowerCase() || '';
            var inputLength = inputValue.length;

            var suggestions = this.props.filters.filter(function (state) {
                return state.toLowerCase().slice(0, inputLength) === inputValue;
            });

            // Define here to escape Jinja
            var inputProps = Object.assign({}, props, { onChange: handleOnChange });

            return React.createElement(Autosuggest, {
                ref: props.ref,
                suggestions: suggestions,
                shouldRenderSuggestions: function shouldRenderSuggestions(value) {
                    return value && value.trim().length > 0;
                },
                getSuggestionValue: function getSuggestionValue(suggestion) {
                    return suggestion;
                },
                renderSuggestion: function renderSuggestion(suggestion) {
                    return React.createElement(
                        'span',
                        { key: suggestion },
                        suggestion
                    );
                },
                inputProps: inputProps,
                onSuggestionSelected: function onSuggestionSelected(e, _ref3) {
                    var suggestion = _ref3.suggestion;

                    addTag(suggestion);
                },
                onSuggestionsClearRequested: function onSuggestionsClearRequested() {},
                onSuggestionsFetchRequested: function onSuggestionsFetchRequested() {}
            });
        }
    }, {
        key: 'setTags',
        value: function setTags(tags) {
            var _this2 = this;

            tags = [].concat(_toConsumableArray(new Set(tags.filter(function (t) {
                return _this2.props.filters.indexOf(t) > -1;
            }))));
            this.setState({ tags: tags }, function () {
                _this2.props.onTagChange(tags);
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var inputProps = {
                placeholder: this.props.placeholder
            };
            return React.createElement(TagsInput, { value: this.state.tags, onChange: this.setTags.bind(this),
                renderInput: this.autocompleteRenderInput.bind(this), inputProps: inputProps });
        }
    }]);

    return FilterControl;
}(React.Component);

function Image(p) {
    return React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
            'a',
            { href: '/image/' + p.filename },
            React.createElement('img', { className: 'img-fluid',
                src: '/image/' + p.filename + '/view/thumb',
                alt: p.name })
        ),
        React.createElement(
            'div',
            { className: 'info' },
            React.createElement(
                'div',
                { className: 'title' },
                p.name
            ),
            p.location && React.createElement(
                'div',
                null,
                React.createElement(
                    'b',
                    null,
                    'Location: '
                ),
                p.location
            ),
            p.taken_time && React.createElement(
                'div',
                null,
                React.createElement(
                    'b',
                    null,
                    'Taken: '
                ),
                p.taken_time
            ),
            p.description && React.createElement(
                'div',
                { className: 'description' },
                React.createElement(
                    'i',
                    null,
                    p.description
                )
            ),
            p.tags && p.tags.length && React.createElement(
                'div',
                { className: 'tags' },
                p.tags.map(function (tag) {
                    return React.createElement(
                        'div',
                        { key: tag, className: 'tag' },
                        tag
                    );
                })
            )
        )
    );
}

var state = {
    tags: [],
    locations: [],
    query: ""
};

function render() {
    fetchData().then(function (data) {
        return ReactDOM.render(React.createElement(
            React.Fragment,
            null,
            React.createElement(
                'div',
                { className: 'header' },
                React.createElement(
                    'h1',
                    null,
                    'Images'
                ),
                React.createElement(
                    'a',
                    { href: '#', 'data-target': '#filter-controls', 'data-toggle': 'collapse' },
                    'Toggle filters'
                )
            ),
            React.createElement(
                'div',
                { className: 'filter-controls collapse', id: 'filter-controls' },
                React.createElement(
                    'div',
                    { className: 'row' },
                    React.createElement(
                        'div',
                        { className: 'col-sm-4' },
                        React.createElement(
                            'div',
                            { className: 'react-tagsinput' },
                            React.createElement('input', { type: 'text', placeholder: 'Search', className: 'react-tagsinput-input',
                                onChange: function onChange(ev) {
                                    state.query = ev.target.value;
                                    render();
                                } })
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'col-sm-4' },
                        React.createElement(FilterControl, { filters: data.tags, placeholder: 'Filter tags',
                            onTagChange: function onTagChange(tags) {
                                state.tags = tags;
                                render();
                            } })
                    ),
                    React.createElement(
                        'div',
                        { className: 'col-sm-4' },
                        React.createElement(FilterControl, { filters: data.locations, placeholder: 'Filter locations',
                            onTagChange: function onTagChange(locations) {
                                state.locations = locations;
                                render();
                            } })
                    )
                )
            ),
            React.createElement(
                'div',
                { className: 'gallery' },
                data.images.filter(function (_, i) {
                    return i % 3 === 0;
                }).concat(data.images.filter(function (_, i) {
                    return (i - 1) % 3 === 0;
                }).concat(data.images.filter(function (_, i) {
                    return (i - 2) % 3 === 0;
                }))).map(function (image) {
                    return React.createElement(Image, Object.assign({ key: image.name }, image));
                })
            )
        ), document.querySelector("div#react-container"));
    });
}

render();