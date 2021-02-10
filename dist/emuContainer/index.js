"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.DEFAULT_VNC_PORT = exports.DEFAULT_APP_PATH = exports.BOLOS_SDK = exports.SCP_PRIVKEY = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

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
var path = require("path");

var Docker = require("dockerode");

var SCP_PRIVKEY = "ff701d781f43ce106f72dc26a46b6a83e053b5d07bb3d4ceab79c91ca822a66b";
exports.SCP_PRIVKEY = SCP_PRIVKEY;
var BOLOS_SDK = "/project/deps/nanos-secure-sdk";
exports.BOLOS_SDK = BOLOS_SDK;
var DEFAULT_APP_PATH = "/project/app/bin";
exports.DEFAULT_APP_PATH = DEFAULT_APP_PATH;
var DEFAULT_VNC_PORT = "8001";
exports.DEFAULT_VNC_PORT = DEFAULT_VNC_PORT;

var EmuContainer = /*#__PURE__*/function () {
  function EmuContainer(elfLocalPath, libElfs, image, name) {
    (0, _classCallCheck2["default"])(this, EmuContainer);
    // eslint-disable-next-line global-require
    this.image = image;
    this.elfLocalPath = elfLocalPath;
    this.libElfs = libElfs;
    this.name = name;
    this.logging = false;
  }

  (0, _createClass2["default"])(EmuContainer, [{
    key: "runContainer",
    value: function () {
      var _runContainer = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(options) {
        var _this = this;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  var _PortBindings;

                  // eslint-disable-next-line global-require
                  var docker = new Docker();

                  if ("logging" in options && options.logging === true) {
                    _this.logging = true;
                  }

                  _this.start_delay = 1000;

                  if ("start_delay" in options) {
                    _this.start_delay = options.start_delay;
                  }

                  var appFilename = path.basename(_this.elfLocalPath);
                  var appDir = path.dirname(_this.elfLocalPath);
                  var dirBindings = ["".concat(appDir, ":").concat(DEFAULT_APP_PATH)];
                  var libArgs = "";
                  Object.entries(_this.libElfs).forEach(function (_ref) {
                    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
                        libName = _ref2[0],
                        libPath = _ref2[1];

                    var libFilename = path.basename(libPath);
                    libArgs += " -l ".concat(libName, ":").concat(DEFAULT_APP_PATH, "/").concat(libFilename);
                  });
                  var displaySetting = "--display headless";

                  if ("X11" in options && options.X11 === true) {
                    displaySetting = "";
                    dirBindings.push("/tmp/.X11-unix:/tmp/.X11-unix:ro");
                  }

                  var customOptions = "";

                  if ("custom" in options) {
                    customOptions = options.custom;
                  }

                  var model = "nanos";

                  if ("model" in options) {
                    model = options.model;
                  }

                  var command = "/home/zondax/speculos/speculos.py --color LAGOON_BLUE ".concat(displaySetting, " ").concat(customOptions, " -m ").concat(model, " --vnc-port ").concat(DEFAULT_VNC_PORT, " ").concat(DEFAULT_APP_PATH, "/").concat(appFilename, " ").concat(libArgs);

                  if (_this.logging) {
                    process.stdout.write("[ZEMU] Command: ".concat(command, "\n"));
                  }

                  var displayEnvironment = process.env.DISPLAY;

                  if (process.platform === "darwin") {
                    displayEnvironment = "host.docker.internal:0";
                  }

                  docker.createContainer({
                    Image: _this.image,
                    name: _this.name,
                    Tty: true,
                    Privileged: true,
                    AttachStdout: true,
                    AttachStderr: true,
                    User: "1000",
                    Env: ["SCP_PRIVKEY=".concat(SCP_PRIVKEY), "BOLOS_SDK=".concat(BOLOS_SDK), "BOLOS_ENV=/opt/bolos", "DISPLAY=".concat(displayEnvironment) // needed if X forwarding
                    ],
                    PortBindings: (_PortBindings = {}, (0, _defineProperty2["default"])(_PortBindings, "1234/tcp", [{
                      HostPort: "1234"
                    }]), (0, _defineProperty2["default"])(_PortBindings, "8001/tcp", [{
                      HostPort: "8001"
                    }]), (0, _defineProperty2["default"])(_PortBindings, "9997/tcp", [{
                      HostPort: "9997"
                    }]), (0, _defineProperty2["default"])(_PortBindings, "9998/tcp", [{
                      HostPort: "9998"
                    }]), (0, _defineProperty2["default"])(_PortBindings, "9999/tcp", [{
                      HostPort: "9999"
                    }]), _PortBindings),
                    Binds: dirBindings,
                    Cmd: [command]
                  }).then(function (container) {
                    _this.currentContainer = container;

                    if (_this.logging) {
                      process.stdout.write("[ZEMU] Connected ".concat(container.id, "\n"));
                    }

                    if (_this.logging) {
                      container.attach({
                        stream: true,
                        stdout: true,
                        stderr: true
                      }, function (err, stream) {
                        stream.pipe(process.stdout);
                      });
                    }

                    return container.start();
                  }).then(function () {
                    resolve(true);
                  });
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function runContainer(_x) {
        return _runContainer.apply(this, arguments);
      }

      return runContainer;
    }()
  }, {
    key: "stop",
    value: function () {
      var _stop = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var currentContainer;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.logging) {
                  process.stdout.write("\n[ZEMU] Stopping container\n");
                }

                currentContainer = this.currentContainer;

                if (!currentContainer) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 5;
                return currentContainer.stop({
                  t: 0
                });

              case 5:
                _context2.next = 7;
                return currentContainer.remove();

              case 7:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function stop() {
        return _stop.apply(this, arguments);
      }

      return stop;
    }()
  }], [{
    key: "killContainerByName",
    value: function () {
      var _killContainerByName = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(name) {
        var docker;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                docker = new Docker();
                _context3.next = 3;
                return new Promise(function (resolve) {
                  docker.listContainers({
                    all: true,
                    filters: {
                      name: [name]
                    }
                  }, function (err, containers) {
                    containers.forEach(function (containerInfo) {
                      docker.getContainer(containerInfo.Id).remove({
                        force: true
                      }, function () {// console.log("container removed");
                      });
                    });
                    return resolve(true);
                  });
                });

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function killContainerByName(_x2) {
        return _killContainerByName.apply(this, arguments);
      }

      return killContainerByName;
    }()
  }, {
    key: "checkAndPullImage",
    value: function () {
      var _checkAndPullImage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(imageName) {
        var docker;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                docker = new Docker();
                _context4.next = 3;
                return new Promise(function (resolve) {
                  docker.pull(imageName, function (err, stream) {
                    docker.modem.followProgress(stream, onFinished, onProgress);

                    function onProgress(event) {
                      var progress = event.hasOwnProperty("progress") ? event.progress : "";
                      var status = event.hasOwnProperty("status") ? event.status : "";
                      console.clear();
                      console.log("*****", "Progress on image:", imageName, "*****");
                      console.log(status, "\n", progress);
                    }

                    function onFinished(err, output) {
                      if (!err) {
                        resolve(true);
                      } else {
                        console.log(err);
                        process.exit(1);
                      }
                    }
                  });
                });

              case 3:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function checkAndPullImage(_x3) {
        return _checkAndPullImage.apply(this, arguments);
      }

      return checkAndPullImage;
    }()
  }]);
  return EmuContainer;
}();

exports["default"] = EmuContainer;