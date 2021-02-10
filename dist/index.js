"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.BASE_NAME = exports.DEFAULT_TRANSPORT_PORT = exports.DEFAULT_VNC_PORT = exports.DEFAULT_HOST = exports.DEFAULT_EMU_IMG = exports.KEYDELAY = exports.TIMEOUT = exports.WINDOW_X = exports.WINDOW_S = exports.KEYS = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _pngjs = _interopRequireDefault(require("pngjs"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _rfb = _interopRequireDefault(require("rfb2"));

var _sleep = _interopRequireDefault(require("sleep"));

var _hwTransportHttp = _interopRequireDefault(require("@ledgerhq/hw-transport-http"));

var _elfy = _interopRequireDefault(require("elfy"));

var _emuContainer = _interopRequireDefault(require("./emuContainer"));

var _grpc = _interopRequireDefault(require("./grpc"));

/** ******************************************************************************
 *  (c) 2020 Zondax GmbH
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ******************************************************************************* */
var Resolve = require("path").resolve;

var rndstr = require("randomstring");

var KILL_TIMEOUT = 10000;
var KEYS = {
  NOT_PRESSED: 0,
  PRESSED: 1,
  // /
  LEFT: 0xff51,
  RIGHT: 0xff53
};
exports.KEYS = KEYS;
var WINDOW_S = {
  x: 0,
  y: 0,
  width: 128,
  height: 32
};
exports.WINDOW_S = WINDOW_S;
var WINDOW_X = {
  x: 0,
  y: 0,
  width: 128,
  height: 64
};
exports.WINDOW_X = WINDOW_X;
var TIMEOUT = 1000;
exports.TIMEOUT = TIMEOUT;
var KEYDELAY = 350;
exports.KEYDELAY = KEYDELAY;
var DEFAULT_EMU_IMG = "zondax/builder-zemu@sha256:42461f9a03af9b75d1e59cefda0b86016dc3e5fc2e8f16d5d0496b1edd3e7c34";
exports.DEFAULT_EMU_IMG = DEFAULT_EMU_IMG;
var DEFAULT_HOST = "127.0.0.1";
exports.DEFAULT_HOST = DEFAULT_HOST;
var DEFAULT_VNC_PORT = 8001;
exports.DEFAULT_VNC_PORT = DEFAULT_VNC_PORT;
var DEFAULT_TRANSPORT_PORT = 9998;
exports.DEFAULT_TRANSPORT_PORT = DEFAULT_TRANSPORT_PORT;
var BASE_NAME = "zemu-656d75-";
exports.BASE_NAME = BASE_NAME;

var Zemu = /*#__PURE__*/function () {
  function Zemu(elfPath) {
    var libElfs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var host = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_HOST;
    var vncPort = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_VNC_PORT;
    var transportPort = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : DEFAULT_TRANSPORT_PORT;
    (0, _classCallCheck2["default"])(this, Zemu);
    this.host = host;
    this.vnc_port = vncPort;
    this.transport_url = "http://".concat(this.host, ":").concat(transportPort);
    this.elfPath = elfPath;
    this.libElfs = libElfs;
    this.press_delay = KEYDELAY;
    this.grpcManager = null;
    this.model = "nanos";
    this.mainMenuSnapshot = null;

    if (this.elfPath == null) {
      throw new Error("elfPath cannot be null!");
    }

    if (!_fsExtra["default"].existsSync(this.elfPath)) {
      throw new Error("elf file was not found! Did you compile?");
    }

    Object.keys(libElfs).forEach(function (libName) {
      if (!_fsExtra["default"].existsSync(libElfs[libName])) {
        throw new Error("lib elf file was not found! Did you compile?");
      }
    });
    var containerName = BASE_NAME + rndstr.generate(5);
    this.emuContainer = new _emuContainer["default"](this.elfPath, this.libElfs, DEFAULT_EMU_IMG, containerName);
  }

  (0, _createClass2["default"])(Zemu, [{
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _this = this;

        var options,
            elfApp,
            elfInfo,
            elfCodeNanoS,
            elfCodeNanoX,
            _args = arguments;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = _args.length > 0 && _args[0] !== undefined ? _args[0] : {};

                if ("press_delay" in options) {
                  this.press_delay = options.press_delay;
                }

                if ("model" in options) {
                  this.model = options.model;
                }

                elfApp = _fsExtra["default"].readFileSync(this.elfPath);
                elfInfo = _elfy["default"].parse(elfApp);
                elfCodeNanoS = 0xc0d00001;
                elfCodeNanoX = 0xc0de0001;

                if (!(elfInfo.entry !== elfCodeNanoS && elfInfo.entry !== elfCodeNanoX)) {
                  _context.next = 9;
                  break;
                }

                throw new Error("Are you sure is a Nano S/X app ?");

              case 9:
                if (!(this.model === "nanos" && elfInfo.entry !== elfCodeNanoS)) {
                  _context.next = 11;
                  break;
                }

                throw new Error("Zemu model is set to 'nanos' but elf file doesn't seem to be nano s build. Did you pass the right elf ?");

              case 11:
                if (!(this.model === "nanox" && elfInfo.entry !== elfCodeNanoX)) {
                  _context.next = 13;
                  break;
                }

                throw new Error("Zemu model is set to 'nanox' but elf file doesn't seem to be nano x build. Did you pass the right elf ?");

              case 13:
                _context.next = 15;
                return this.emuContainer.runContainer(options);

              case 15:
                _context.next = 17;
                return this.connect()["catch"](function (error) {
                  console.log(error);

                  _this.close();
                });

              case 17:
                _context.next = 19;
                return this.snapshot();

              case 19:
                this.mainMenuSnapshot = _context.sent;

              case 20:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function start() {
        return _start.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: "connect",
    value: function () {
      var _connect = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // FIXME: Can we detect open ports?
                Zemu.delay(this.emuContainer.start_delay);
                _context2.next = 3;
                return (0, _hwTransportHttp["default"])(this.transport_url).open(this.transport_url);

              case 3:
                this.transport = _context2.sent;
                _context2.next = 6;
                return this.connectVNC();

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function connect() {
        return _connect.apply(this, arguments);
      }

      return connect;
    }()
  }, {
    key: "connectVNC",
    value: function () {
      var _connectVNC = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        var _this2 = this;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt("return", new Promise(function (resolve, reject) {
                  _this2.session = _rfb["default"].createConnection({
                    host: _this2.host,
                    port: _this2.vnc_port
                  });

                  if (_this2.emuContainer.logging) {
                    process.stdout.write("[ZEMU] VNC Connection created ".concat(_this2.host, ":").concat(_this2.vnc_port, "\n"));
                  }

                  var session = _this2.session;
                  var logging = _this2.emuContainer.logging;

                  _this2.session.on("connect", function () {
                    if (logging) {
                      process.stdout.write("[ZEMU] VNC Session ready\n");
                    }

                    session.keyEvent(KEYS.LEFT, KEYS.NOT_PRESSED);
                    session.keyEvent(KEYS.RIGHT, KEYS.NOT_PRESSED);
                    resolve(true);
                  });

                  var vnc_port = _this2.vnc_port;
                  var host = _this2.host;

                  _this2.session.on("error", function (error) {
                    console.log("Could not connect to port ".concat(vnc_port, "  on ").concat(host));
                    reject(error);
                  });

                  setTimeout(function () {
                    return reject(new Error("timeout on connectVNC"));
                  }, 10000);
                }));

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function connectVNC() {
        return _connectVNC.apply(this, arguments);
      }

      return connectVNC;
    }()
  }, {
    key: "startgrpcServer",
    value: function startgrpcServer(ip, port) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      this.grpcManager = new _grpc["default"](ip, port, options, this.transport);
      this.grpcManager.startServer();
    }
  }, {
    key: "stopgrpcServer",
    value: function stopgrpcServer() {
      if (this.grpcManager) {
        this.grpcManager.stopServer();
      }
    }
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.emuContainer.stop();

              case 2:
                if (this.session) {
                  this.session.end();
                }

                this.stopgrpcServer();

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function close() {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }, {
    key: "getTransport",
    value: function getTransport() {
      return this.transport;
    }
  }, {
    key: "getWindowRect",
    value: function getWindowRect() {
      switch (this.model) {
        case "nanos":
          return WINDOW_S;

        case "nanox":
          return WINDOW_X;
      }

      throw "model ".concat(this.model, " not recognized");
    }
  }, {
    key: "snapshot",
    value: function () {
      var _snapshot = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(filename) {
        var _this3 = this;

        var session;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                session = this.session;
                return _context5.abrupt("return", new Promise(function (resolve, reject) {
                  session.once("rect", function (rect) {
                    if (filename) {
                      Zemu.saveRGBA2Png(rect, filename);
                    }

                    resolve(rect);
                  });

                  var modelWindow = _this3.getWindowRect();

                  session.requestUpdate(false, 0, 0, modelWindow.width, modelWindow.height);
                  setTimeout(function () {
                    return reject(new Error("timeout"));
                  }, TIMEOUT);
                }));

              case 2:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function snapshot(_x) {
        return _snapshot.apply(this, arguments);
      }

      return snapshot;
    }()
  }, {
    key: "getMainMenuSnapshot",
    value: function () {
      var _getMainMenuSnapshot = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt("return", this.mainMenuSnapshot);

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getMainMenuSnapshot() {
        return _getMainMenuSnapshot.apply(this, arguments);
      }

      return getMainMenuSnapshot;
    }()
  }, {
    key: "waitUntilScreenIsNot",
    value: function () {
      var _waitUntilScreenIsNot = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(screen) {
        var timeout,
            start,
            inputSnapshotBufferHex,
            currentSnapshotBufferHex,
            elapsed,
            _args7 = arguments;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                timeout = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : 10000;
                start = new Date();
                _context7.next = 4;
                return screen;

              case 4:
                inputSnapshotBufferHex = _context7.sent.buffer.toString("hex");
                _context7.next = 7;
                return this.snapshot();

              case 7:
                currentSnapshotBufferHex = _context7.sent.buffer.toString("hex");

              case 8:
                if (!(inputSnapshotBufferHex === currentSnapshotBufferHex)) {
                  _context7.next = 19;
                  break;
                }

                elapsed = new Date() - start;

                if (!(elapsed > timeout)) {
                  _context7.next = 12;
                  break;
                }

                throw "Timeout waiting for screen to change (".concat(timeout, " ms)");

              case 12:
                _context7.next = 14;
                return Zemu.delay(100);

              case 14:
                _context7.next = 16;
                return this.snapshot();

              case 16:
                currentSnapshotBufferHex = _context7.sent.buffer.toString("hex");
                _context7.next = 8;
                break;

              case 19:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function waitUntilScreenIsNot(_x2) {
        return _waitUntilScreenIsNot.apply(this, arguments);
      }

      return waitUntilScreenIsNot;
    }()
  }, {
    key: "compareSnapshotsAndAccept",
    value: function () {
      var _compareSnapshotsAndAccept = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(path, testcaseName, snapshotCount, backClickCount) {
        var snapshotPrefixGolden, snapshotPrefixTmp, localBackClickCount, imageIndex, indexStr, filename, j, _j, _j2, _j3, img1, img2;

        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                snapshotPrefixGolden = Resolve("".concat(path, "/snapshots/").concat(testcaseName));
                snapshotPrefixTmp = Resolve("".concat(path, "/snapshots-tmp/").concat(testcaseName));

                _fsExtra["default"].ensureDirSync(snapshotPrefixGolden);

                _fsExtra["default"].ensureDirSync(snapshotPrefixTmp);

                localBackClickCount = typeof backClickCount === "undefined" ? 0 : backClickCount;
                process.stdout.write("[ZEMU] forward: ".concat(snapshotCount, " backwards: ").concat(localBackClickCount, "\n"));
                process.stdout.write("[ZEMU] golden      ".concat(snapshotPrefixGolden, "\n"));
                process.stdout.write("[ZEMU] tmp         ".concat(snapshotPrefixTmp, "\n"));
                imageIndex = 0;
                indexStr = "00000";
                filename = "".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png");
                process.stdout.write("[ZEMU] Start       ".concat(filename, "\n"));
                _context8.next = 14;
                return this.snapshot(filename);

              case 14:
                j = 0;

              case 15:
                if (!(j < snapshotCount)) {
                  _context8.next = 25;
                  break;
                }

                imageIndex += 1;
                indexStr = "".concat(imageIndex).padStart(5, "0");
                filename = "".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png");
                _context8.next = 21;
                return this.clickRight(filename);

              case 21:
                process.stdout.write("[ZEMU] Click Right ".concat(filename, "\n"));

              case 22:
                j += 1;
                _context8.next = 15;
                break;

              case 25:
                _j = 0;

              case 26:
                if (!(_j < localBackClickCount)) {
                  _context8.next = 36;
                  break;
                }

                imageIndex += 1;
                indexStr = "".concat(imageIndex).padStart(5, "0");
                filename = "".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png");
                process.stdout.write("[ZEMU] Click Left  ".concat(filename, "\n"));
                _context8.next = 33;
                return this.clickLeft("".concat(filename));

              case 33:
                _j += 1;
                _context8.next = 26;
                break;

              case 36:
                _j2 = 0;

              case 37:
                if (!(_j2 < localBackClickCount)) {
                  _context8.next = 47;
                  break;
                }

                imageIndex += 1;
                indexStr = "".concat(imageIndex).padStart(5, "0");
                filename = "".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png");
                process.stdout.write("[ZEMU] Click Right ".concat(filename, "\n"));
                _context8.next = 44;
                return this.clickRight("".concat(filename));

              case 44:
                _j2 += 1;
                _context8.next = 37;
                break;

              case 47:
                imageIndex += 1;
                indexStr = "".concat(imageIndex).padStart(5, "0");
                filename = "".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png");
                process.stdout.write("[ZEMU] Click Both  ".concat(filename, "\n"));
                _context8.next = 53;
                return this.clickBoth("".concat(filename));

              case 53:
                process.stdout.write("[ZEMU] Start comparison\n");

                for (_j3 = 0; _j3 < imageIndex + 1; _j3 += 1) {
                  indexStr = "".concat(_j3).padStart(5, "0");
                  process.stdout.write("[ZEMU] Checked     ".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png\n"));
                  img1 = Zemu.LoadPng2RGB("".concat(snapshotPrefixTmp, "/").concat(indexStr, ".png"));
                  img2 = Zemu.LoadPng2RGB("".concat(snapshotPrefixGolden, "/").concat(indexStr, ".png"));
                  expect(img1).toEqual(img2);
                }

              case 55:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function compareSnapshotsAndAccept(_x3, _x4, _x5, _x6) {
        return _compareSnapshotsAndAccept.apply(this, arguments);
      }

      return compareSnapshotsAndAccept;
    }()
  }, {
    key: "clickLeft",
    value: function () {
      var _clickLeft = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(filename) {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                this.session.keyEvent(KEYS.LEFT, KEYS.PRESSED);
                Zemu.delay(this.press_delay);
                this.session.keyEvent(KEYS.LEFT, KEYS.NOT_PRESSED);
                Zemu.delay(this.press_delay);
                return _context9.abrupt("return", this.snapshot(filename));

              case 5:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function clickLeft(_x7) {
        return _clickLeft.apply(this, arguments);
      }

      return clickLeft;
    }()
  }, {
    key: "clickRight",
    value: function () {
      var _clickRight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(filename) {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                this.session.keyEvent(KEYS.RIGHT, KEYS.PRESSED);
                Zemu.delay(this.press_delay);
                this.session.keyEvent(KEYS.RIGHT, KEYS.NOT_PRESSED);
                Zemu.delay(this.press_delay);
                return _context10.abrupt("return", this.snapshot(filename));

              case 5:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function clickRight(_x8) {
        return _clickRight.apply(this, arguments);
      }

      return clickRight;
    }()
  }, {
    key: "clickBoth",
    value: function () {
      var _clickBoth = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(filename) {
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                this.session.keyEvent(KEYS.LEFT, KEYS.PRESSED);
                this.session.keyEvent(KEYS.RIGHT, KEYS.PRESSED);
                Zemu.delay(this.press_delay);
                this.session.keyEvent(KEYS.LEFT, KEYS.NOT_PRESSED);
                this.session.keyEvent(KEYS.RIGHT, KEYS.NOT_PRESSED);
                Zemu.delay(this.press_delay);
                return _context11.abrupt("return", this.snapshot(filename));

              case 7:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function clickBoth(_x9) {
        return _clickBoth.apply(this, arguments);
      }

      return clickBoth;
    }()
  }], [{
    key: "saveRGBA2Png",
    value: function saveRGBA2Png(rect, filename) {
      var png = new _pngjs["default"].PNG({
        width: rect.width,
        height: rect.height,
        data: rect.data
      });
      png.data = rect.data.slice();

      var buffer = _pngjs["default"].PNG.sync.write(png, {
        colorType: 6
      });

      _fsExtra["default"].writeFileSync(filename, buffer);
    }
  }, {
    key: "LoadPng2RGB",
    value: function LoadPng2RGB(filename) {
      var tmpBuffer = _fsExtra["default"].readFileSync(filename);

      return _pngjs["default"].PNG.sync.read(tmpBuffer, {
        colorType: 6
      });
    }
  }, {
    key: "delay",
    value: function delay(v) {
      if (v) {
        _sleep["default"].msleep(v);
      } else {
        _sleep["default"].msleep(KEYDELAY);
      }
    }
  }, {
    key: "stopAllEmuContainers",
    value: function () {
      var _stopAllEmuContainers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
        var timer;
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                timer = setTimeout(function () {
                  console.log("Could not kill all containers before timeout!");
                  process.exit(1);
                }, KILL_TIMEOUT);
                _context12.next = 3;
                return _emuContainer["default"].killContainerByName(BASE_NAME);

              case 3:
                clearTimeout(timer);

              case 4:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12);
      }));

      function stopAllEmuContainers() {
        return _stopAllEmuContainers.apply(this, arguments);
      }

      return stopAllEmuContainers;
    }()
  }, {
    key: "checkAndPullImage",
    value: function () {
      var _checkAndPullImage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return _emuContainer["default"].checkAndPullImage(DEFAULT_EMU_IMG);

              case 2:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13);
      }));

      function checkAndPullImage() {
        return _checkAndPullImage.apply(this, arguments);
      }

      return checkAndPullImage;
    }()
  }, {
    key: "sleep",
    value: function sleep(ms) {
      return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
      });
    }
  }, {
    key: "delayedPromise",
    value: function () {
      var _delayedPromise = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(p, delay) {
        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                _context14.next = 2;
                return Promise.race([p, new Promise(function (resolve) {
                  setTimeout(resolve, delay);
                })]);

              case 2:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14);
      }));

      function delayedPromise(_x10, _x11) {
        return _delayedPromise.apply(this, arguments);
      }

      return delayedPromise;
    }()
  }]);
  return Zemu;
}();

exports["default"] = Zemu;